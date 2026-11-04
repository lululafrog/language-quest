// Sauvegarde en ligne de la progression personnelle (île, mots, lectures) de l'élève connectée.
import { useEffect } from '../vendor/preact-htm.js';
import { getState, subscribe, personal, applyPersonal } from '../store.js';
import { fb } from './fb.js';

export function useCloudSync(code, uid) {
  useEffect(() => {
    if (!code || !uid) return;
    let off = () => {}, timer = null, ready = false, last = '';
    (async () => {
      try {
        const f = await fb();
        const ref = f.fs.doc(f.db, 'classes', code, 'players', uid, 'sync', 'main');
        const snap = await f.fs.getDoc(ref);
        const remote = snap.exists() ? snap.data() : null;
        // Une autre élève utilisait ce téléphone : on charge la progression de celle-ci à la place.
        const owner = getState().owner;
        applyPersonal(remote, uid, owner && owner !== uid ? 'replace' : 'merge');
        ready = true;
        const push = () => {
          const data = personal();
          const json = JSON.stringify(data);
          if (json === last || getState().owner !== uid) return;
          last = json;
          f.fs.setDoc(ref, { ...data, updated: f.fs.serverTimestamp() }).catch(() => { last = ''; });
        };
        push();
        off = subscribe(() => { if (!ready) return; clearTimeout(timer); timer = setTimeout(push, 2500); });
      } catch { /* hors ligne : on réessaiera à la prochaine ouverture */ }
    })();
    return () => { off(); clearTimeout(timer); };
  }, [code, uid]);
}
