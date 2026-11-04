// QR code d'accès à la classe : une affiche à montrer ou imprimer.
export const APP_URL = 'https://lululafrog.github.io/language-quest/';
export const joinUrl = (code) => `${APP_URL}#/s/join/${code}`;

function loadLib() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
    s.onload = () => res(window.qrcode);
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

// Affiche 1080×1350 : titre, QR, code de classe, consignes en indonésien (anglais).
export async function drawPoster(canvas, code, className) {
  const qrcode = await loadLib();
  const qr = qrcode(0, 'M');
  qr.addData(joinUrl(code));
  qr.make();
  const W = 1080, H = 1350;
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#a9dcf3'); sky.addColorStop(0.55, '#fff8ec'); sky.addColorStop(1, '#fde9b8');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  // Le Rinjani en fond
  c.fillStyle = '#8d6e63';
  c.beginPath(); c.moveTo(0, 360); c.lineTo(330, 150); c.lineTo(420, 190); c.lineTo(540, 70); c.lineTo(660, 170); c.lineTo(760, 140); c.lineTo(W, 360); c.closePath(); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.moveTo(500, 110); c.lineTo(540, 70); c.lineTo(585, 112); c.lineTo(560, 102); c.lineTo(540, 122); c.lineTo(520, 104); c.closePath(); c.fill();
  c.textAlign = 'center';
  c.fillStyle = '#1f2a37';
  c.font = '800 72px system-ui, sans-serif'; c.fillText('Language Quest', W / 2, 450);
  c.font = '600 40px system-ui, sans-serif'; c.fillText(`🌴 ${className || 'Bintang Lombok'} 🌋`, W / 2, 510);
  // QR sur carte blanche
  const n = qr.getModuleCount(), box = 620, cell = Math.floor(box / (n + 8)), size = cell * (n + 8);
  const x0 = (W - size) / 2, y0 = 560;
  c.fillStyle = '#fff';
  c.beginPath(); c.roundRect(x0 - 20, y0 - 20, size + 40, size + 40, 40); c.fill();
  c.fillStyle = '#1f2a37';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) c.fillRect(x0 + (k + 4) * cell, y0 + (r + 4) * cell, cell, cell);
  const yb = y0 + size + 90;
  c.font = '700 44px system-ui, sans-serif';
  c.fillText('Scan untuk masuk! (Scan to join!)', W / 2, yb);
  c.font = '600 36px system-ui, sans-serif'; c.fillStyle = '#6b7280';
  c.fillText('Kode kelas (Class code)', W / 2, yb + 70);
  c.font = '900 84px system-ui, sans-serif'; c.fillStyle = '#ef6c4d';
  c.fillText(code.split('').join(' '), W / 2, yb + 160);
  return canvas;
}
