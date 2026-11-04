// Deux éditions : la version de la prof (français, aperçu claude.ai) et l'édition enfants
// hébergée (indonésien, anglais entre parenthèses, aucun français). index.html choisit l'édition.
export const KIDS = typeof window !== 'undefined' && window.LQ_EDITION === 'kids';

let ui = KIDS ? 'id' : 'fr';
export const setUiLang = (l) => { if (!KIDS) ui = l; };
export const isStudentUi = () => ui === 'id';
export const T = (fr, id) => (ui === 'id' ? id : fr);
// « Mulai (Start) »
export const B = (id, en) => `${id} (${en})`;

// Progrès signalés aux missions de l'espace élève (photo, touch, race…).
export const progress = (kind, n = 1) => window.dispatchEvent(new CustomEvent('lq:progress', { detail: { kind, n } }));
