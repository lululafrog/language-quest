// Boîtes de dialogue intégrées à la page (alert/confirm/prompt ne marchent pas partout).
import { T, B } from './i18n.js';
import { html, useState, useEffect } from './vendor/preact-htm.js';
import { download } from './csv.js';

let current = null;
const subs = new Set();
const show = (d) => { current = d; subs.forEach((f) => f(d)); };

export function ask({ title, message = '', input = false, value = '', ok = 'OK', cancel = T('Annuler', B('Batal', 'Cancel')), danger = false }) {
  return new Promise((resolve) => show({ kind: 'ask', title, message, input, value, ok, cancel, danger, resolve }));
}
export const confirmBox = (title, ok = T('Confirmer', B('Ya', 'Yes'))) => ask({ title, ok, danger: true });
export const promptBox = (title, value = '') => ask({ title, input: true, value }).then((r) => (r === false ? null : r));
export function notify(message) {
  return new Promise((resolve) => show({ kind: 'notify', message, resolve }));
}
// Exporter : affiche le contenu à copier, avec téléchargement quand le navigateur l'autorise.
export function exportText(name, content, type) {
  show({ kind: 'export', name, content, type, resolve: () => {} });
}

export function Dialogs() {
  const [d, setD] = useState(current);
  const [val, setVal] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { const f = (x) => { setD(x); setVal(x?.value || ''); setCopied(false); }; subs.add(f); return () => subs.delete(f); }, []);
  if (!d) return null;
  const close = (r) => { show(null); d.resolve(r); };
  const copy = async (e) => {
    const ta = e.target.closest('.modal').querySelector('textarea');
    try { await navigator.clipboard.writeText(d.content); setCopied(true); }
    catch { ta.select(); setCopied('select'); }
  };
  return html`<div class="modal-bg" onClick=${() => close(false)}>
    <form class="modal" onClick=${(e) => e.stopPropagation()} onSubmit=${(e) => { e.preventDefault(); close(d.input ? val.trim() || false : true); }}>
      ${d.kind === 'ask' && html`<h2>${d.title}</h2>${d.message && html`<p>${d.message}</p>`}
        ${d.input && html`<input id="dialog-input" class="input" autofocus value=${val} onInput=${(e) => setVal(e.target.value)} />`}
        <div class="row" style="justify-content:flex-end;margin-top:1rem">
          <button type="button" class="btn ghost" onClick=${() => close(false)}>${d.cancel}</button>
          <button class=${'btn ' + (d.danger ? 'coral' : 'primary')}>${d.ok}</button></div>`}
      ${d.kind === 'notify' && html`<p style="white-space:pre-line">${d.message}</p>
        <div class="row" style="justify-content:flex-end"><button class="btn primary" autofocus>OK</button></div>`}
      ${d.kind === 'export' && html`<h2>Exporter</h2>
        <p class="muted small">Copie ce texte et colle-le dans une note ou un e-mail pour le garder. Sur ordinateur, tu peux aussi télécharger le fichier.</p>
        <textarea id="dialog-export" class="input" rows="8" readonly value=${d.content}></textarea>
        ${copied && html`<p class="small">${copied === true ? '✓ Copié' : 'Texte sélectionné : utilise Copier de ton appareil.'}</p>`}
        <div class="row wrap" style="justify-content:flex-end;margin-top:.6rem">
          <button type="button" class="btn ghost" onClick=${() => download(d.name, d.content, d.type)}>⬇️ Télécharger ${d.name.split('.').pop().toUpperCase()}</button>
          <button type="button" class="btn primary" onClick=${copy}>📋 Copier</button>
          <button type="button" class="btn ghost" onClick=${() => close()}>Fermer</button></div>`}
    </form></div>`;
}
