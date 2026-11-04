// Choisir sa voix : écouter les voix du téléphone, garder sa préférée, régler vitesse et ton.
import { html } from '../vendor/preact-htm.js';
import { useStore, update } from '../store.js';
import { rankVoices, voiceFor, voiceScore, speak } from '../speech.js';
import { useVoices, go } from '../ui.js';
import { T, B } from '../i18n.js';

const SAMPLE = {
  en: 'Hello! I am your English voice. Let\'s read a story together.',
  id: 'Halo! Ayo kita belajar bersama.',
};

export function VoicePicker({ lang = 'en' }) {
  const s = useStore();
  useVoices();
  const list = rankVoices(lang);
  const cur = voiceFor(lang);
  const set = (fn) => update((st) => { fn(st.settings); });
  const choose = (v) => { set((x) => { x.voices = { ...(x.voices || {}), [lang]: v.name }; }); setTimeout(() => speak(SAMPLE[lang], lang), 50); };
  const badge = (v) => {
    const sc = voiceScore(v);
    return sc >= 50 ? '✨ ' + T('naturelle', 'alami (natural)') : sc >= 25 ? '🙂 ' + T('douce', 'lembut (soft)') : '';
  };
  return html`<div class="voice-picker">
    ${list.length === 0 ? html`<p class="muted">${T('Aucune voix pour cette langue sur cet appareil.', B('Belum ada suara untuk bahasa ini di HP ini', 'No voice for this language on this phone'))}</p>` : html`
      <div class="voice-list">${list.slice(0, 12).map((v) => html`
        <button class=${'voice' + (cur && v.name === cur.name ? ' on' : '')} onClick=${() => choose(v)}>
          <span class="voice-ic">${cur && v.name === cur.name ? '🔊' : '▶'}</span>
          <span class="grow"><b>${v.name.replace(/\s*\(.*$/, '').replace(/Microsoft |Google /, '').trim()}</b>
            <span class="small muted block">${v.lang}${badge(v) ? ' · ' + badge(v) : ''}${v.localService ? '' : ' · 🌐 online'}</span></span>
          ${cur && v.name === cur.name ? html`<span class="pill ok">✓</span>` : ''}
        </button>`)}</div>`}
    <label class="voice-slider">🐢 ${T('Vitesse', B('Kecepatan', 'Speed'))}
      <input type="range" min="0.6" max="1.1" step="0.02" value=${s.settings.rate} onChange=${(e) => { set((x) => { x.rate = +e.target.value; }); speak(SAMPLE[lang], lang); }} /> 🐇</label>
    <label class="voice-slider">🎵 ${T('Ton', B('Nada', 'Pitch'))}
      <input type="range" min="0.8" max="1.3" step="0.05" value=${s.settings.pitch ?? 1.05} onChange=${(e) => { set((x) => { x.pitch = +e.target.value; }); speak(SAMPLE[lang], lang); }} /></label>
    <button class="btn ghost sm" onClick=${() => { set((x) => { x.rate = 0.82; x.pitch = 1.05; x.voices = { ...(x.voices || {}), [lang]: undefined }; }); speak(SAMPLE[lang], lang); }}>↺ ${T('Réglage conseillé', B('Pengaturan terbaik', 'Best setting'))}</button>
  </div>`;
}

// Écran élève.
export function VoiceScreen() {
  return html`<div class="page narrow student">
    <button class="btn ghost sm" onClick=${() => history.back()}>← ${B('Kembali', 'Back')}</button>
    <h1>🎙️ ${B('Pilih suara', 'Choose a voice')}</h1>
    <p class="muted">${B('Sentuh untuk mendengar. Pilih suara yang paling kamu suka!', 'Tap to listen. Choose the voice you like best!')}</p>
    <${VoicePicker} lang="en" />
    <details class="card voice-tip"><summary>💡 ${B('Mau suara yang lebih bagus?', 'Want a nicer voice?')}</summary>
      <p><b>Android:</b> Setelan → Aksesibilitas → Output teks ke ucapan → ⚙️ Google → Instal data suara → English → ${B('pilih suara perempuan, kualitas tinggi', 'pick a female, high-quality voice')}.</p>
      <p><b>iPhone:</b> Setelan → Aksesibilitas → Konten Lisan → Suara → English → ${B('unduh suara « Enhanced » atau « Premium » (contoh: Ava, Samantha)', 'download an « Enhanced » or « Premium » voice (e.g. Ava, Samantha)')}.</p>
      <p class="muted small">${B('Setelah itu, buka lagi halaman ini dan pilih suara baru.', 'Then come back to this page and choose the new voice.')}</p>
    </details>
  </div>`;
}
