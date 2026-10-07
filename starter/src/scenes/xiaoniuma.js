// xiaoniuma.js —《小牛马》37 s MV.
// Visual language: an office photocopier / risograph print. Every frame is "printed" in four spot inks
// (fluoro pink, riso blue, yellow, navy) multiplied onto off-white copy paper, with halftone tints, slight
// plate misregistration and toner grain. The copier's scanning light bar is the transition device; payslips,
// receipts and queue tickets are the recurring props. Everything is a pure function of t (boil at 12 fps).
// Drawn with Canvas 2D on our own layer and handed to the starter's compositor (paper grain + vignette).
(() => {
  // ------------------------------------------------------------------ setup
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const INK = { pink: '#FF4FA0', blue: '#3A62D6', yel: '#FFCF2E', navy: '#25224A', paper: '#F6F0E3', teal: '#2BB3A5' };
  const MIS = { [INK.pink]: [3, -2], [INK.blue]: [-2, 2], [INK.yel]: [2, 3], [INK.navy]: [0, 0], [INK.teal]: [-2, -2] };
  const FONTS = [['ZK', 'assets/fonts/ZCOOLQingKeHuangYou-Regular.ttf', {}], ['NS', 'assets/fonts/NotoSansSC-VF.ttf', { weight: '100 900' }],
                 ['DG', 'assets/fonts/DotGothic16-Regular.ttf', {}]];
  window.SCENE_READY = Promise.all(FONTS.map(([n, u, d]) => new FontFace(n, `url(${u})`, d).load().then(f => document.fonts.add(f))));

  // our layer replaces the p5 frame in the compositor (paper grain/vignette from core.js stay on top)
  composite = function () {
    const o = outX; o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
    o.drawImage(cv, 0, 0);
    o.globalCompositeOperation = 'multiply'; o.drawImage(grainC, 0, 0);
    o.globalCompositeOperation = 'source-over';
  };

  // ------------------------------------------------------------------ deterministic noise
  let BN = 0;                                   // boil frame (12 fps)
  const h1 = x => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const jb = (k, a) => (h1(k * 3.17 + BN * 7.31) - .5) * 2 * a;   // boiling jitter for key k
  const beatT = t => (t - OFF) / BEAT;
  const onBeat = (t, k = 7) => Math.exp(-frac(beatT(t)) * k);
  const sh = (t, amp, f = 30) => { const n = Math.floor(t * f); return [(h1(n * 1.3) - .5) * 2 * amp, (h1(n * 2.9 + 5) - .5) * 2 * amp]; };

  // ------------------------------------------------------------------ halftone patterns
  const PATS = {};
  function pat(col, step = 12, r = .32, ang = 15) {
    const key = col + step + r + ang; if (PATS[key]) return PATS[key];
    const g = document.createElement('canvas'); g.width = g.height = step; const x = g.getContext('2d');
    x.fillStyle = col; x.beginPath(); x.arc(step / 2, step / 2, step * r, 0, TAU); x.fill();
    const p = c.createPattern(g, 'repeat'); p.setTransform(new DOMMatrix().rotate(ang)); return PATS[key] = p;
  }
  const linePat = (col, step = 14, wdt = 4, ang = -30) => {
    const key = 'L' + col + step + wdt + ang; if (PATS[key]) return PATS[key];
    const g = document.createElement('canvas'); g.width = step; g.height = step; const x = g.getContext('2d');
    x.fillStyle = col; x.fillRect(0, 0, wdt, step);
    const p = c.createPattern(g, 'repeat'); p.setTransform(new DOMMatrix().rotate(ang)); return PATS[key] = p;
  };

  // ------------------------------------------------------------------ ink primitives (multiply = overprint)
  function ink(col, fn, o = {}) {
    c.save(); c.globalCompositeOperation = o.over ? 'source-over' : 'multiply'; c.globalAlpha = o.a ?? 1;
    const m = MIS[col] || [0, 0]; if (!o.reg) c.translate(m[0], m[1]);
    c.fillStyle = o.tone ? pat(col, o.tone[0], o.tone[1], o.tone[2] ?? 15) : o.lines ? linePat(col, ...o.lines) : col;
    c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
    fn(); c.restore();
  }
  const paperFill = fn => { c.save(); c.globalCompositeOperation = 'source-over'; c.fillStyle = INK.paper; c.strokeStyle = INK.paper; c.lineJoin = 'round'; fn(); c.restore(); };
  function blob(cx, cy, rx, ry, key = 0, amp = 3, n = 26, rot = 0) {
    const p = new Path2D(), pts = [];
    for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, j = 1 + jb(key + i, amp / Math.max(rx, ry, 1)); pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]); }
    smoothClosed(p, pts); return p;
  }
  function smoothClosed(p, pts) {
    const n = pts.length; const mid = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
    const m0 = mid(0); p.moveTo(m0[0], m0[1]);
    for (let i = 1; i <= n; i++) { const m = mid(i); p.quadraticCurveTo(pts[i % n][0], pts[i % n][1], m[0], m[1]); }
    p.closePath();
  }
  function wpoly(pts, key = 0, amp = 2.5) { const p = new Path2D(); pts.forEach(([x, y], i) => { const X = x + jb(key + i * 2, amp), Y = y + jb(key + i * 2 + 1, amp); i ? p.lineTo(X, Y) : p.moveTo(X, Y); }); p.closePath(); return p; }
  const wrect = (x, y, w, h, key = 0, amp = 2.5) => wpoly([[x, y], [x + w / 2, y], [x + w, y], [x + w, y + h / 2], [x + w, y + h], [x + w / 2, y + h], [x, y + h], [x, y + h / 2]], key, amp);
  function rrect(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
  function wline(pts, wdt, key = 0, amp = 1.5) { c.lineWidth = wdt; c.beginPath(); pts.forEach(([x, y], i) => { const X = x + jb(key + i, amp), Y = y + jb(key + i + 50, amp); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); }

  // full-frame fields
  const field = (col, o = {}) => ink(col, () => c.fillRect(-200, -200, W + 400, H + 400), o);

  // ------------------------------------------------------------------ type
  // txt: one line of type. Knock-out paper rim keeps it readable over any picture (also at phone size).
  function txt(s, x, y, size, o = {}) {
    const font = o.font || 'ZK', col = o.col || INK.navy;
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); c.scale(o.sx || 1, o.sy || 1);
    c.font = `${o.weight || ''} ${size}px "${font}"`.trim(); c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
    if (o.spacing) c.letterSpacing = o.spacing + 'px';
    c.globalAlpha = o.a ?? 1;
    if (o.knock !== 0) { c.globalCompositeOperation = 'source-over'; c.lineJoin = 'round'; c.lineWidth = size * (o.knock ?? .16); c.strokeStyle = o.knockCol || INK.paper; c.strokeText(s, 0, 0); }
    c.globalCompositeOperation = 'multiply';
    if (o.col2) { const d = size * (o.off ?? .045); c.fillStyle = o.col2; c.fillText(s, d, d); }
    c.fillStyle = col; c.fillText(s, 0, 0);
    if (o.over) { c.globalCompositeOperation = 'source-over'; c.fillStyle = col; c.fillText(s, 0, 0); }
    c.restore();
  }
  const tw = (s, size, font = 'ZK', spacing = 0) => { c.save(); c.font = `${size}px "${font}"`; if (spacing) c.letterSpacing = spacing + 'px'; const w = c.measureText(s).width; c.restore(); return w; };

  // lyric timing (句级时间轴: faster-whisper word stamps cross-checked against the vocal-band energy envelope)
  const LY = [
    ['小牛马七点起', [0.30, 0.62, 0.95, 1.48, 2.40, 2.88]],
    ['慌慌张张急急忙忙', [3.58, 4.10, 4.42, 4.64, 4.88, 5.12, 5.36, 5.60]],
    ['上班去', [5.86, 6.16, 6.54]],
    ['一月工资', [7.30, 8.06, 8.42, 8.90]],
    ['三千一', [9.32, 9.86, 10.20]],
    ['却想攒够一个亿', [11.00, 11.50, 11.86, 12.04, 12.32, 12.60, 12.88]],
    ['什么刮风下雨', [14.86, 15.18, 15.48, 15.84, 16.00, 16.36]],
    ['什么高温天气', [16.84, 17.08, 17.32, 17.70, 17.86, 18.12]],
    ['什么公交拥挤', [18.90, 19.09, 19.26, 19.54, 19.76, 20.10]],
    ['什么客户挑剔', [20.58, 20.83, 21.06, 21.38, 21.58, 21.84]],
    ['什么感冒发烧', [22.08, 22.48, 22.90, 23.26, 23.44, 23.74]],
    ['什么带病身体', [24.34, 24.57, 24.76, 25.16, 25.28, 25.54]],
    ['什么累到昏迷', [25.94, 26.27, 26.60, 27.00, 27.16, 27.54]],
    ['什么挨领导批', [28.04, 28.27, 28.46, 28.86, 29.06, 29.30]],
    ['都挡不住', [29.98, 30.24, 30.46, 30.70]],
    ['小小牛马的', [30.90, 31.12, 31.36, 31.62, 31.80]],
    ['意志力', [31.92, 32.22, 32.54]],
    ['为了三千', [33.20, 33.92, 34.12, 34.38]],
    ['拼到底', [34.58, 34.90, 35.26]],
  ];
  const LEAD = .1;   // a character lands a hair before it is sung
  const age = (li, k, t) => t - (LY[li][1][k] - LEAD);
  const pop = a => a <= 0 ? 0 : backOut(clamp(a / .16));
  // draw each character of lyric li laid out left→right from (x,y), each popping on its own sung time
  function lyric(li, t, x, y, size, o = {}) {
    const s = LY[li][0], font = o.font || 'ZK', gap = o.gap ?? size * .02, from = o.from || 0;
    const ws = [...s].map((ch, k) => k < from ? 0 : tw(ch, size, font) * (o.sx || 1) + gap), tot = ws.reduce((a, b) => a + b, 0) - gap;
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - tot : x - tot / 2;
    [...s].forEach((ch, k) => {
      const a = age(li, k, t), w = ws[k];
      if (k >= from && (a > 0 || o.ghost)) {
        const p = a > 0 ? pop(a) : 1, f = o.each ? o.each(k, a, ch) : {};
        const px = cx + w / 2 + (f.dx || 0), py = y + (f.dy || 0);
        txt(ch, px, py, size * (a > 0 ? p : 1) * (f.s || 1), { ...o, ...f, a: a > 0 ? (f.a ?? 1) : .12, rot: (o.rot || 0) + (f.rot || 0) });
      }
      cx += w;
    });
    return tot;
  }
  // vertical lyric
  function lyricV(li, t, x, y, size, o = {}) {
    [...LY[li][0]].forEach((ch, k) => { const a = age(li, k, t); if (a > 0) { const f = o.each ? o.each(k, a) : {}; txt(ch, x + (f.dx || 0), y + k * size * 1.04 + (f.dy || 0), size * pop(a), { ...o, ...f }); } });
  }

  // ------------------------------------------------------------------ the hero: 小牛马
  // A small ox-horse office worker: ox horns, horse mane, a huge tired head on a tiny body, shirt, tie, staff badge.
  // (x, y) = point between the hooves on the ground; s = scale (s = 1 → about 270 px tall).
  function niuma(x, y, s, o = {}) {
    const k = 'nm' + (o.id || 0), kk = h1(x * .001 + (o.id || 0)) * 100;
    const run = o.run, ph = (run ?? 0) * TAU;
    const bob = run != null ? -Math.abs(Math.sin(ph)) * 14 : (o.bob || 0);
    const sq = o.sq || 0;
    c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); c.rotate(o.lean || 0); c.scale(1 + sq, 1 - sq); c.translate(0, bob);
    // legs (4 stubby hooves)
    const legs = [[-36, 0], [-14, 1.2], [14, 2.1], [36, 3.3]];
    legs.forEach(([lx, phs], i) => {
      const sw = run != null ? Math.sin(ph + phs * Math.PI / 2 + i) * 22 : 0, lift = run != null ? Math.max(0, Math.cos(ph + phs * Math.PI / 2 + i)) * 12 : 0;
      ink(INK.blue, () => c.fill(wrect(lx - 9 + sw * .4, -34 - lift, 18, 30, kk + i * 9, 1.5)));
      ink(INK.navy, () => c.fill(wrect(lx - 10 + sw * .55, -10 - lift, 20, 10, kk + i * 7, 1)));
    });
    // body
    const body = wrect(-56, -122, 112, 96, kk + 30, 2.5);
    ink(INK.blue, () => c.fill(body));
    // shirt + tie
    paperFill(() => c.fill(wpoly([[-30, -122], [30, -122], [16, -40], [-16, -40]], kk + 40, 1.5)));
    ink(INK.pink, () => c.fill(wpoly([[-8, -118], [8, -118], [11, -64], [0, -52], [-11, -64]], kk + 44, 1.2)));
    // staff badge on a lanyard
    ink(INK.navy, () => { wline([[-26, -120], [-4, -78], [24, -120]], 2.5, kk + 50, 1); });
    ink(INK.yel, () => c.fill(wrect(-18, -80, 30, 38, kk + 52, 1.2)));
    ink(INK.navy, () => { c.fillRect(-12, -70, 18, 3); c.fillRect(-12, -62, 12, 3); });
    // arms (little hooves) — angles in radians, 0 = hanging down
    const arm = (side, ang, key) => {
      const ax = side * 52, ay = -108, L = 46, ex = ax + Math.sin(ang) * L * side, ey = ay + Math.cos(ang) * L;
      ink(INK.blue, () => wline([[ax, ay], [(ax + ex) / 2, (ay + ey) / 2], [ex, ey]], 18, kk + key, 1));
      ink(INK.navy, () => c.fill(blob(ex, ey, 10, 10, kk + key + 5, 1, 10)));
      return [ex, ey];
    };
    const aL = o.armL ?? (run != null ? .9 + Math.sin(ph) * .9 : .25), aR = o.armR ?? (run != null ? .9 - Math.sin(ph) * .9 : .25);
    const hl = arm(-1, aL, 60), hr = arm(1, aR, 70);
    if (o.hold) o.hold(hr, hl);
    // head
    c.save(); c.translate(0, -122); c.rotate(o.tilt || 0); c.translate(0, 122);
    const hy = -186 + (o.headDy || 0);
    // ears + horns + mane behind
    for (const sd of [-1, 1]) {
      ink(INK.blue, () => c.fill(blob(sd * 86, hy - 14, 26, 13, kk + 80 + sd, 1.5, 14, sd * .35)));
      ink(INK.yel, () => c.fill(wpoly([[sd * 40, hy - 52], [sd * 58, hy - 98], [sd * 70, hy - 92], [sd * 62, hy - 48]], kk + 90 + sd, 1.5)));
    }
    ink(INK.pink, () => c.fill(wpoly([[-24, hy - 54], [-14, hy - 92], [-2, hy - 60], [8, hy - 100], [16, hy - 60], [30, hy - 84], [30, hy - 50]], kk + 100, 2)));
    ink(INK.blue, () => c.fill(blob(0, hy, 80, 66, kk + 110, 2.5, 30)));
    // muzzle
    ink(INK.pink, () => c.fill(blob(0, hy + 34, 50, 30, kk + 120, 1.5, 20)));
    ink(INK.navy, () => { c.fill(blob(-15, hy + 30, 5, 7, kk + 125, .5, 8)); c.fill(blob(15, hy + 30, 5, 7, kk + 126, .5, 8)); });
    // mouth
    const m = o.mouth || 'flat';
    ink(INK.navy, () => {
      if (m === 'flat') wline([[-14, hy + 50], [0, hy + 49], [14, hy + 50]], 3.5, kk + 130, .8);
      else if (m === 'o') c.fill(blob(0, hy + 50, 8, 9, kk + 131, .8, 12));
      else if (m === 'grit') { c.fill(wrect(-18, hy + 44, 36, 12, kk + 132, .8)); paperFill(() => c.fillRect(-14, hy + 48, 28, 4)); }
      else if (m === 'smile') wline([[-15, hy + 46], [0, hy + 54], [15, hy + 46]], 3.5, kk + 133, .8);
      else if (m === 'wave') wline([[-16, hy + 50], [-8, hy + 46], [0, hy + 51], [8, hy + 46], [16, hy + 50]], 3, kk + 134, .6);
    });
    // eyes
    const e = o.eyes || 'tired';
    for (const sd of [-1, 1]) {
      const ex = sd * 32, ey = hy - 12;
      if (e === 'spiral') { ink(INK.navy, () => { c.lineWidth = 3.5; c.beginPath(); for (let i = 0; i < 40; i++) { const a = i * .45 + T * 9 * sd, r = i * .5; c.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r); } c.stroke(); }); continue; }
      if (e === 'x') { ink(INK.navy, () => { wline([[ex - 10, ey - 10], [ex + 10, ey + 10]], 4, kk + 140 + sd); wline([[ex + 10, ey - 10], [ex - 10, ey + 10]], 4, kk + 145 + sd); }); continue; }
      if (e === 'closed') { ink(INK.navy, () => wline([[ex - 12, ey + 2], [ex, ey + 6], [ex + 12, ey + 2]], 3.5, kk + 150 + sd)); continue; }
      paperFill(() => c.fill(blob(ex, ey, 17, 20, kk + 160 + sd, 1, 14)));
      const lx = (o.look || [0, 0])[0] * 6, ly = (o.look || [0, 0])[1] * 6;
      ink(INK.navy, () => c.fill(blob(ex + lx, ey + 3 + ly, e === 'wide' ? 6 : 8, e === 'wide' ? 6 : 9, kk + 170 + sd, .6, 10)));
      const lid = o.lid ?? (e === 'tired' ? .5 : e === 'fire' ? .3 : e === 'wide' ? 0 : .25);
      if (lid > 0) ink(INK.blue, () => c.fill(wrect(ex - 21, ey - 24, 42, 44 * lid, kk + 180 + sd, .6)), { reg: 1 });
      if (e === 'fire') ink(INK.navy, () => wline([[ex - 18 * sd, ey - 26], [ex + 16 * sd, ey - 16]], 5, kk + 190 + sd));
      if (e === 'tired') ink(INK.navy, () => wline([[ex - 14, ey + 24], [ex, ey + 27], [ex + 14, ey + 24]], 2, kk + 195 + sd));   // eye bags
    }
    if (o.blush) for (const sd of [-1, 1]) ink(INK.pink, () => c.fill(blob(sd * 56, hy + 10, 14, 8, kk + 200 + sd, .8, 12)), { a: .9 });
    if (o.mask) { paperFill(() => c.fill(wrect(-46, hy + 12, 92, 54, kk + 210, 1.5))); ink(INK.teal, () => { c.fill(wrect(-46, hy + 12, 92, 54, kk + 210, 1.5)); }, { tone: [7, .3] }); ink(INK.navy, () => { wline([[-46, hy + 20], [-80, hy - 6]], 2.5, kk + 214); wline([[46, hy + 20], [80, hy - 6]], 2.5, kk + 215); }); }
    // sweat drops
    for (let i = 0; i < (o.sweat || 0); i++) {
      const a = frac(T * 1.6 + i * .37), sx = (i % 2 ? 1 : -1) * (70 + 18 * i), sy = hy - 40 + a * 70;
      ink(INK.teal, () => c.fill(wpoly([[sx, sy - 16], [sx + 9, sy + 2], [sx, sy + 9], [sx - 9, sy + 2]], kk + 220 + i, .8)), { a: 1 - a });
    }
    c.restore();
    c.restore();
  }

  // ------------------------------------------------------------------ shared props
  function scanBar(x, o = {}) {        // the photocopier's light bar, vertical, at screen x
    c.save(); c.globalCompositeOperation = 'source-over';
    const g = c.createLinearGradient(x - 220, 0, x + 60, 0);
    g.addColorStop(0, 'rgba(255,240,170,0)'); g.addColorStop(.75, 'rgba(255,236,150,.55)'); g.addColorStop(.97, 'rgba(255,253,235,.98)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    c.fillStyle = g; c.fillRect(x - 220, -50, 280, H + 100);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(120,255,200,.35)'; c.fillRect(x - 6, -50, 8, H + 100);
    c.restore();
  }
  function digits(s, x, y, size, col, o = {}) { txt(s, x, y, size, { font: 'DG', col, knock: 0, ...o }); }
  function stamp(s, x, y, size, a, o = {}) {      // rubber stamp slam, a = age
    if (a <= 0) return;
    const k = a < .08 ? lerp(2.2, 1, easeIn(a / .08)) : 1 + .06 * Math.exp(-a * 14) * Math.sin(a * 60);
    const wdt = tw(s, size, o.font || 'ZK') + size * .5, hh = size * 1.25;
    c.save(); c.translate(x, y); c.rotate(o.rot ?? -.06); c.scale(k, k);
    ink(o.col || INK.pink, () => { c.lineWidth = size * .09; c.stroke(wrect(-wdt / 2, -hh / 2, wdt, hh, 900 + size, 3)); }, { a: a < .08 ? .6 : 1 });
    txt(s, 0, size * .02, size, { col: o.col || INK.pink, knock: 0, font: o.font, col2: o.col2 });
    c.restore();
  }
  // a thermal receipt strip with printed rows; rows = [[text, size, font, col]]
  function receipt(x, y, w, len, rows, key = 0, o = {}) {
    const p = new Path2D(); p.moveTo(x, y); p.lineTo(x + w, y);
    const n = 14; p.lineTo(x + w, y + len);
    for (let i = n; i >= 0; i--) p.lineTo(x + w * i / n, y + len + (i % 2 ? 12 : 0));
    p.closePath();
    ink(INK.navy, () => { c.translate(10, 12); c.fill(p); }, { a: .22, tone: [6, .35] });
    paperFill(() => c.fill(p));
    ink(INK.navy, () => { c.lineWidth = 2; c.stroke(p); }, { a: .5 });
    c.save(); c.clip(p);
    let yy = y + 50;
    for (const r of rows) { if (r === '-') { ink(INK.navy, () => { c.setLineDash([10, 8]); c.lineWidth = 3; c.beginPath(); c.moveTo(x + 24, yy); c.lineTo(x + w - 24, yy); c.stroke(); }); yy += 34; continue; }
      const [s, size, font, col, al] = r; txt(s, al === 'left' ? x + 30 : x + w / 2, yy + size / 2, size, { font: font || 'DG', col: col || INK.navy, knock: 0, align: al || 'center' }); yy += size * 1.3; }
    c.restore();
  }

  // ================================================================== SHOTS
  // A 0–3.5   小牛马七点起 — the alarm: a giant 07:00 (copier-scanned in), the hero pops out of bed
  function shotA(t) {
    field(INK.paper, { over: 1 });
    const ring = t > .3 && t < 3.2, [sx, sy] = ring ? sh(t, 7 + 8 * onBeat(t), 24) : [0, 0];
    // radiating alarm lines behind
    ink(INK.yel, () => { for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + t * .4; c.beginPath(); c.moveTo(960, 400); c.arc(960, 400, 1400, a, a + .09); c.fill(); } }, { a: .9 });
    // clock case
    c.save(); c.translate(sx, sy);
    ink(INK.blue, () => c.fill(wrect(250, 150, 1420, 520, 11, 4)), { tone: [11, .38] });
    ink(INK.navy, () => { c.lineWidth = 14; c.stroke(wrect(250, 150, 1420, 520, 11, 4)); });
    for (const sd of [-1, 1]) {   // bells
      const bx = 960 + sd * 560, by = 120, wob2 = ring ? Math.sin(t * 50 + sd) * .25 : 0;
      c.save(); c.translate(bx, by + 30); c.rotate(wob2 + sd * .2);
      ink(INK.pink, () => c.fill(blob(0, -40, 90, 70, 20 + sd, 3)));
      ink(INK.navy, () => { c.lineWidth = 8; c.beginPath(); c.moveTo(0, 30); c.lineTo(0, 0); c.stroke(); });
      c.restore();
      if (ring) for (let i = 0; i < 3; i++) ink(INK.navy, () => wline([[bx + sd * (130 + i * 26), by - 60 + i * 40], [bx + sd * (175 + i * 30), by - 80 + i * 40]], 7, 30 + i + sd * 5));
    }
    const blink = t < 0.3 || frac(t * 2) < .78;
    if (blink) { digits('07:00', 968, 430, 470, INK.pink, { col2: INK.blue, off: .02 }); }
    c.restore();
    // bed + blanket at the bottom, hero pops out on 七 (1.48)
    ink(INK.navy, () => c.fill(wrect(560, 900, 800, 40, 40, 2)));
    const up = seg(t, 1.36, 1.62), hop = take(t, 1.62, 1.1);
    const hy = lerp(1040, 900, backOut(up));
    niuma(960, hy + hop.dy * 40, 1.02, { eyes: t < 2.35 ? 'closed' : 'wide', mouth: t < 2.35 ? 'flat' : 'o', sq: hop.sq, sweat: t > 2.4 ? 2 : 0, armL: t > 1.6 ? 2.6 : .3, armR: t > 1.6 ? 2.4 : .3, tilt: t < 1.4 ? .25 : Math.sin(t * 12) * .04 });
    ink(INK.blue, () => c.fill(wpoly([[520, 860 + 40 * (1 - up)], [1400, 880 + 40 * (1 - up)], [1420, 1100], [500, 1100]], 50, 3)), { tone: [9, .42, 45] });
    ink(INK.pink, () => c.fill(wpoly([[520, 860 + 40 * (1 - up)], [1400, 880 + 40 * (1 - up)], [1405, 905 + 40 * (1 - up)], [515, 890 + 40 * (1 - up)]], 51, 2)));
    // lyric: 小牛马 left, 七点起 right — big, on knock-out
    lyric(0, t, 130, 840, 150, { align: 'left', col: INK.navy, col2: INK.pink, each: (k) => k < 3 ? {} : { dx: 720 } });
    // hook: the copier light bar scans the first frame in (0 → .5 s)
    if (t < .5) { const x = lerp(120, W + 240, easeOut(seg(t, 0, .45))); paperFill(() => c.fillRect(x, -10, W, H + 20)); scanBar(x); }
  }

  // B 3.5–7.2  慌慌张张急急忙忙 / 上班去 — the sprint: city scrolls, the words fly off behind
  function shotB(t, lt) {
    field(INK.paper, { over: 1 });
    const v = 900;   // scroll px/s
    // far skyline (blue tint) and near (navy halftone)
    for (let layer = 0; layer < 2; layer++) {
      const sp = layer ? v * .9 : v * .35, col = layer ? INK.navy : INK.blue, base = layer ? 820 : 760;
      for (let i = -2; i < 14; i++) {
        const bw = 180 + 120 * h1(i * 7 + layer), bh = (layer ? 160 : 300) + 260 * h1(i * 3.3 + layer * 9), px = ((i * 260 - lt * sp) % (14 * 260) + 14 * 260) % (14 * 260) - 300;
        ink(col, () => c.fill(wrect(px, base - bh, bw, bh + 300, 300 + i + layer * 40, 2)), { tone: layer ? [9, .3, 45] : [12, .4] , a: layer ? .55 : 1 });
        if (!layer) for (let wy = 0; wy < 4; wy++) ink(INK.yel, () => c.fillRect(px + 30, base - bh + 40 + wy * 60, bw - 60, 18));
      }
    }
    ink(INK.navy, () => c.fillRect(-10, 960, W + 20, 140));
    ink(INK.yel, () => { for (let i = 0; i < 12; i++) { const px = ((i * 260 - lt * v * 1.3) % 3120 + 3120) % 3120 - 200; c.fillRect(px, 1010, 120, 14); } });
    // speed lines
    ink(INK.pink, () => { for (let i = 0; i < 9; i++) { const yy = 200 + h1(i * 5) * 700, px = ((h1(i) * 3000 - lt * 2600) % 2600 + 2600) % 2600 - 300; c.fillRect(px, yy, 260, 6); } }, { a: .8 });
    // the hero: sprinting, toast in mouth, sweating
    const hx = 760 + 30 * Math.sin(lt * 3), toSign = seg(t, 6.6, 7.2);
    niuma(hx + toSign * 260, 960, 1.05, { run: lt * 3.3, lean: .16, eyes: 'wide', mouth: 'grit', sweat: 3, armL: undefined,
      hold: () => {} });
    // toast
    const toastX = hx + toSign * 260 + 70 * 1.05, toastY = 960 - 150 * 1.05 + Math.abs(Math.sin(lt * 3.3 * TAU)) * -14;
    ink(INK.yel, () => c.fill(wrect(toastX, toastY - 30, 54, 48, 330, 2)));
    ink(INK.pink, () => { c.lineWidth = 5; c.stroke(wrect(toastX, toastY - 30, 54, 48, 330, 2)); }, { a: .7 });
    // 慌慌张张急急忙忙: each char lands ahead (right) and is left behind as he runs → reads left to right
    [...LY[1][0]].forEach((ch, k) => {
      const a = age(1, k, t); if (a <= 0) return;
      const x = 1560 - a * 560, y = 250 + (k % 2 ? 110 : 0) + Math.sin(a * 9 + k) * 6, rot = (h1(k + 3) - .5) * .4;
      txt(ch, x, y, 140 * pop(a), { col: k % 2 ? INK.blue : INK.pink, col2: INK.navy, off: .035, rot });
    });
    // 上班去 on a swinging sign that drops in from above
    const a = age(2, 0, t);
    if (a > 0) {
      const dy = lerp(-420, 0, backOut(clamp(a / .35))), sw = .12 * Math.exp(-a * 3) * Math.sin(a * 9);
      c.save(); c.translate(1470, 470 + dy); c.rotate(sw);
      ink(INK.navy, () => { c.lineWidth = 6; c.beginPath(); c.moveTo(-180, -140); c.lineTo(-180, -700); c.moveTo(180, -140); c.lineTo(180, -700); c.stroke(); });
      ink(INK.yel, () => c.fill(wpoly([[-300, -140], [250, -140], [340, 0], [250, 140], [-300, 140]], 340, 3)));
      [...'上班去'].forEach((ch, k) => { const b = age(2, k, t); if (b > 0) txt(ch, -190 + k * 170, 6, 150 * pop(b), { col: INK.navy, knock: 0, col2: INK.pink }); });
      c.restore();
    }
  }

  // C 7.2–11.0  一月工资 / 三千一 — the payslip prints out; the stamp says 三千一
  function shotC(t, lt) {
    field(INK.paper, { over: 1 });
    field(INK.blue, { tone: [14, .3] });
    const push = 1 + lt * .02;
    c.save(); c.translate(960, 540); c.scale(push, push); c.translate(-960, -540);
    // printer
    ink(INK.navy, () => c.fill(wrect(360, 40, 760, 170, 400, 3)));
    ink(INK.pink, () => c.fill(blob(1040, 120, 18, 18, 401, 1, 12)), { a: frac(t * 3) < .5 ? 1 : .3 });
    const len = lerp(250, 780, easeOut(seg(t, 7.2, 10.4)));
    receipt(470, 190, 540, len, [
      ['* * * * * * * * * *', 30], ['', 30],
      ['一月工资', 92, 'NS', INK.navy],
      '-',
      ['NO. 0001        ¥', 30, 'DG', INK.navy, 'left'],
      ['3,100.00', 110, 'DG', INK.navy],
      '-', ['||| ||  | ||| | || |||', 48],
    ], 410);
    c.restore();
    // hero at the side, staring at the slip
    const tk = take(t, 9.40, .8);
    niuma(1480, 1000, 1.08, { eyes: t > 9.4 ? 'wide' : 'tired', mouth: t > 9.4 ? 'wave' : 'flat', look: [-1, -.3], sq: tk.sq, bob: tk.dy * 30, sweat: t > 9.5 ? 2 : 0, armR: 2.2, armL: .4 });
    // 三千一 stamped across the slip — the small number, made loud
    const a0 = age(4, 0, t);
    if (a0 > 0) {
      [...'三千一'].forEach((ch, k) => { const a = age(4, k, t); if (a > 0) stamp(ch, 560 + k * 200, 820, 160, a, { rot: -.08 + k * .04, col2: INK.navy }); });
    }
  }

  // D 11.0–14.85  却想攒够一个亿 — the dream: 1 0000 0000 rises like a skyline over a very small worker
  function shotD(t, lt) {
    field(INK.paper, { over: 1 });
    const zoom = lerp(1.25, .78, ease(seg(t, 11.3, 13.6)));
    c.save(); c.translate(960, 760); c.scale(zoom, zoom); c.translate(-960, -760);
    // sky glow
    ink(INK.yel, () => c.fill(blob(960, 560, 1100, 520, 500, 6, 30)), { tone: [12, .44] });
    // the nine digits rise one by one
    const DIG = '100000000', n = DIG.length, dw = 205, x0 = 960 - (n - 1) * dw / 2;
    for (let i = 0; i < n; i++) {
      const ti = 11.15 + i * .2, k = backOut(clamp((t - ti) / .3)), hgt = 640 * k;
      if (k <= 0) continue;
      const x = x0 + i * dw;
      c.save(); c.beginPath(); c.rect(x - 110, 960 - hgt - 40, 220, hgt + 60); c.clip();
      digits(DIG[i], x, 960 - 300, 560, i === 0 ? INK.pink : INK.blue, { col2: INK.navy, off: .015 });
      // windows
      ink(INK.yel, () => { for (let w2 = 0; w2 < 6; w2++) if (h1(i * 9 + w2 + Math.floor(t * 4)) > .4) c.fillRect(x - 12, 960 - 520 + w2 * 70, 24, 24); }, { a: .9 });
      c.restore();
      if (i === 0 || i === 3 || i === 6) {}   // spacing reads from the digits themselves
    }
    // ground
    ink(INK.navy, () => c.fillRect(-400, 958, W + 800, 400));
    // the hero, tiny, with the tiny slip
    niuma(960, 958, .42, { eyes: 'wide', look: [0, -1], mouth: 'smile', blush: 1, armR: 2.6, armL: .3,
      hold: ([hx, hy]) => { paperFill(() => c.fill(wrect(hx - 16, hy - 46, 34, 44, 520, 1))); ink(INK.navy, () => { c.fillRect(hx - 10, hy - 36, 22, 3); c.fillRect(hx - 10, hy - 26, 16, 3); }); } });
    c.restore();
    // 却想攒够 (smaller, a thought) then 一个亿 (enormous)
    lyric(5, t, 140, 140, 100, { align: 'left', font: 'NS', weight: 900, col: INK.navy, col2: INK.pink, each: (k) => k < 4 ? {} : { a: 0 } });
    [...'一个亿'].forEach((ch, k) => {
      const a = age(5, 4 + k, t); if (a <= 0) return;
      const p = a < .12 ? lerp(3, 1, easeIn(a / .12)) : 1 + .04 * Math.sin(a * 6);
      txt(ch, 640 + k * 330, 330, 300 * p, { col: INK.pink, col2: INK.yel, off: .05, knock: .12 });
    });
    // exit: the zeros roll off as coins → flash
    if (t > 14.5) { const k = seg(t, 14.5, 14.85); paperFill(() => { c.globalAlpha = easeIn(k); c.fillRect(0, 0, W, H); }); }
  }

  // ------------------------------------------------------------------ E: the eight "什么" — queue tickets slammed on a pile
  const EW = [[14.80, 16.80], [16.80, 18.82], [18.82, 20.52], [20.52, 22.02], [22.02, 24.28], [24.28, 25.90], [25.90, 27.98], [27.98, 29.94]];
  const CARD_BG = [INK.paper, INK.yel, INK.blue, INK.paper, INK.pink, INK.blue, INK.navy, INK.paper];
  function eRain(t, lt) {
    field(INK.blue, { tone: [10, .3] });
    ink(INK.blue, () => { for (let i = 0; i < 90; i++) { const x = ((h1(i) * 2400 - lt * 900 + i * 40) % 2400 + 2400) % 2400 - 200, y = ((h1(i + 7) * 1300 + lt * 1500) % 1300) - 100; wline([[x, y], [x - 60, y + 110]], 5, 600 + i, .5); } });
    ink(INK.navy, () => { for (let i = 0; i < 5; i++) { const y = 420 + i * 110, x = ((lt * 1400 + i * 500) % 2600) - 400; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - 200, y - 40, x - 300, y + 60, x - 520, y); c.stroke(); } }, { a: .6 });
    ink(INK.navy, () => c.fillRect(-10, 970, W + 20, 120));
    const lean = -.22 + Math.sin(lt * 8) * .04;
    niuma(1040, 970, .95, { run: lt * 1.1, lean, eyes: 'tired', mouth: 'grit', armR: 2.9, sweat: 0,
      hold: ([hx, hy]) => { // inside-out umbrella
        ink(INK.navy, () => wline([[hx, hy], [hx + 20, hy - 190]], 6, 610));
        c.save(); c.translate(hx + 20, hy - 190); c.rotate(.3 + Math.sin(lt * 14) * .15);
        ink(INK.pink, () => c.fill(wpoly([[-130, -120], [-60, 0], [0, -40], [60, 0], [130, -140], [0, 10]], 612, 4)));
        c.restore(); } });
    if (age(6, 0, t) > 0) { const p = pop(age(6, 0, t)); c.save(); c.translate(250, 210); c.scale(p, p); c.translate(-250, -210);
      ink(INK.pink, () => c.fill(wrect(130, 140, 240, 140, 620, 3)));
      txt('什么', 250, 210, 110, { col: INK.navy, knock: 0 }); c.restore(); }
    lyric(6, t, 1030, 400, 220, { from: 2, rot: -.08, col: INK.navy, col2: INK.pink, each: (k, a) => k < 2 ? { a: 0 } : { dx: -k * 6 + Math.sin(lt * 10 + k) * 8 + (1 - clamp(a * 4)) * 260, dy: Math.sin(lt * 7 + k) * 10 } });
  }
  function eHeat(t, lt) {
    field(INK.yel, { over: 0 });
    c.save(); c.translate(1560, 330); c.rotate(lt * .6);
    ink(INK.pink, () => { for (let i = 0; i < 14; i++) { c.rotate(TAU / 14); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 1800, -.06, .06); c.fill(); } }, { tone: [10, .4] });
    c.restore();
    ink(INK.pink, () => c.fill(blob(1560, 330, 230 + 10 * onBeat(t), 230 + 10 * onBeat(t), 700, 5)));
    ink(INK.navy, () => { for (let i = 0; i < 6; i++) { const y = 990 - i * 18; c.lineWidth = 5; c.beginPath(); for (let x = 0; x <= W; x += 40) c.lineTo(x, y + Math.sin(x * .02 + lt * 9 + i) * 8); c.stroke(); } }, { a: .5 });
    const melt = .18 + .1 * Math.sin(lt * 3);
    niuma(860, 1000, 1.0, { sq: melt, eyes: 'tired', lid: .7, mouth: 'wave', sweat: 4, tilt: .1, armL: .1, armR: .1 });
    // a puddle of himself
    ink(INK.blue, () => c.fill(blob(860, 1004, 200 + lt * 30, 26, 710, 3)));
    txt('什么', 250, 250, 150, { col: INK.pink, col2: INK.navy, rot: -.05, a: age(7, 0, t) > 0 ? 1 : 0 });
    lyric(7, t, 440, 260, 200, { from: 2, align: 'left', col: INK.navy, col2: INK.pink, each: (k, a) => k < 2 ? { a: 0 } : { dy: Math.sin(lt * 6 + k * 1.3) * 16, sy: 1 + .08 * Math.sin(lt * 5 + k) } });
  }
  function eBus(t, lt) {
    field(INK.blue, { tone: [9, .34] });
    const rock = Math.sin(lt * 9) * .012, [sx, sy] = sh(t, 4, 15);
    c.save(); c.translate(960 + sx, 690 + sy); c.rotate(rock); c.translate(-960, -690);
    ink(INK.yel, () => c.fill(wrect(60, 430, 1800, 520, 800, 4)));
    ink(INK.navy, () => { c.fill(blob(400, 960, 80, 80, 801, 2)); c.fill(blob(1500, 960, 80, 80, 802, 2)); });
    for (let w2 = 0; w2 < 5; w2++) {
      const wx = 140 + w2 * 340;
      paperFill(() => c.fill(wrect(wx, 480, 300, 250, 810 + w2, 2)));
      c.save(); c.beginPath(); c.rect(wx, 480, 300, 250); c.clip();
      for (let p = 0; p < 4; p++) {   // packed heads: same species, all squeezed
        const px = wx + 30 + p * 80 + Math.sin(lt * 10 + p + w2) * 4;
        if (w2 === 2 && p === 1) continue;
        ink(INK.navy, () => { c.fill(blob(px, 640, 46, 52, 820 + p + w2 * 5, 2)); c.fill(wpoly([[px - 34, 600], [px - 50, 560], [px - 22, 594]], 830 + p)); c.fill(wpoly([[px + 34, 600], [px + 50, 560], [px + 22, 594]], 840 + p)); c.fillRect(px - 40, 690, 80, 80); }, { tone: [6, .45] });
      }
      if (w2 === 2) niuma(wx + 150, 870, .82, { sq: -.0, eyes: 'x', mouth: 'wave', tilt: .0, lean: 0, armL: 3, armR: 3, sweat: 2 });
      c.restore();
      ink(INK.navy, () => { c.lineWidth = 8; c.stroke(wrect(wx, 480, 300, 250, 810 + w2, 2)); });
    }
    c.restore();
    // the type gets squeezed too
    txt('什么', 330, 230, 150, { col: INK.pink, col2: INK.navy, sx: .62, sy: 1.25, a: age(8, 0, t) > 0 ? 1 : 0 });
    for (let k = 2; k < 6; k++) { const a = age(8, k, t); if (a > 0) txt(LY[8][0][k], 560 + (k - 2) * 150, 230, 215 * pop(a), { col: INK.navy, col2: INK.yel, sx: .6 + .06 * Math.sin(lt * 12 + k), sy: 1.25 }); }
  }
  function eClient(t, lt) {
    field(INK.paper, { over: 1 });
    // the document
    c.save(); c.translate(860, 560); c.rotate(-.03);
    paperFill(() => c.fill(wrect(-640, -430, 1200, 860, 900, 3)));
    ink(INK.navy, () => { c.lineWidth = 4; c.stroke(wrect(-640, -430, 1200, 860, 900, 3)); });
    ink(INK.blue, () => { for (let i = 0; i < 7; i++) c.fillRect(-560, -40 + i * 60, 900 - h1(i) * 300, 16); }, { a: .7 });
    c.restore();
    // pen marks: crosses, circles, arrows (accumulate)
    const marks = [[360, 560, 21.0], [760, 640, 21.2], [520, 760, 21.35], [1100, 600, 21.55], [960, 820, 21.7], [380, 860, 21.85]];
    marks.forEach(([mx, my, mt], i) => { const k = seg(t, mt, mt + .12); if (k <= 0) return; ink(INK.pink, () => { c.lineWidth = 12; c.beginPath(); c.moveTo(mx - 40, my - 40); c.lineTo(mx - 40 + 80 * k, my - 40 + 80 * k); if (k > .5) { c.moveTo(mx + 40, my - 40); c.lineTo(mx + 40 - 160 * (k - .5), my - 40 + 160 * (k - .5)); } c.stroke(); }); });
    // title: the lyric, then the client's pen circles 挑剔
    txt('什么', 330, 270, 140, { col: INK.blue, col2: INK.navy, a: age(9, 0, t) > 0 ? 1 : 0 });
    lyric(9, t, 470, 270, 190, { from: 2, align: 'left', col: INK.navy, col2: INK.pink, each: (k) => k < 2 ? { a: 0 } : {} });
    const ck = seg(t, 21.62, 21.95);
    if (ck > 0) ink(INK.pink, () => { c.lineWidth = 10; c.beginPath(); c.ellipse(1040, 275, 230, 130, -.08, -1, -1 + ck * 6.6); c.stroke(); });
    // the client's giant hand + pen from the right
    const px = lerp(1900, 1250, easeOut(seg(t, 20.6, 20.9))) + Math.sin(lt * 18) * 30, py = 640 + Math.cos(lt * 15) * 60;
    ink(INK.navy, () => { c.save(); c.translate(px, py); c.rotate(-.6); c.fill(wrect(-20, -10, 40, 300, 920, 2)); c.restore(); });
    ink(INK.pink, () => c.fill(wpoly([[px - 10, py - 8], [px + 20, py + 12], [px - 26, py + 40]], 921)));
    ink(INK.blue, () => c.fill(blob(px + 170, py + 230, 190, 150, 922, 4)), { tone: [8, .45] });
    niuma(1640, 1060, .7, { eyes: 'wide', mouth: 'wave', sweat: 3, look: [-1, -.5], armL: 2, armR: 2.2 });
  }
  function eFever(t, lt) {
    field(INK.pink, { tone: [12, .34] });
    // thermometer
    const lvl = lerp(.2, .97, easeOut(seg(t, 22.1, 23.9))) + .02 * Math.sin(lt * 20);
    paperFill(() => c.fill(rrect(170, 120, 150, 760, 75)));
    ink(INK.navy, () => { c.lineWidth = 9; c.stroke(rrect(170, 120, 150, 760, 75)); });
    ink(INK.pink, () => { c.fill(blob(245, 900, 120, 120, 1000, 3)); c.fillRect(205, 880 - 720 * lvl, 80, 720 * lvl + 20); });
    ink(INK.navy, () => { for (let i = 0; i < 12; i++) c.fillRect(320, 200 + i * 55, i % 3 ? 26 : 46, 6); });
    digits('39.8', 245, 1000 - 20, 70, INK.navy, { a: lvl > .9 ? 1 : 0 });
    // the hero: masked, flushed, shivering, wrapped in tissues
    const shiv = Math.sin(lt * 40) * 4;
    niuma(860 + shiv, 1010, 1.15, { mask: 1, blush: 1, eyes: 'tired', lid: .55, sweat: 3, armL: 1.3, armR: 1.1, tilt: .06 });
    for (let i = 0; i < 5; i++) { const a = frac(lt * .7 + i * .2); paperFill(() => c.fill(blob(560 + i * 130 + Math.sin(a * 9) * 30, lerp(-80, 1100, a), 46, 30, 1010 + i, 4))); }
    txt('什么', 1250, 280, 120, { col: INK.navy, col2: INK.blue, a: age(10, 0, t) > 0 ? 1 : 0 });
    lyricV(10, t, 1500, 240, 168, { col: INK.navy, col2: INK.yel, each: (k, a) => k < 2 ? { a: 0 } : { dy: -2 * 168 * 1.04, dx: Math.sin(lt * 30 + k) * 3 } });
  }
  function eSick(t, lt) {
    field(INK.blue, { tone: [12, .3] });
    // desk + laptop
    ink(INK.navy, () => c.fill(wrect(200, 880, 1520, 60, 1100, 3)));
    ink(INK.navy, () => c.fill(wpoly([[1020, 870], [1340, 870], [1300, 700], [1060, 700]], 1101, 2)), { tone: [5, .45] });
    // IV drip pole
    ink(INK.navy, () => { c.lineWidth = 9; c.beginPath(); c.moveTo(560, 1080); c.lineTo(560, 450); c.lineTo(640, 450); c.stroke(); });
    ink(INK.yel, () => c.fill(wrect(600, 460, 90, 140, 1110, 2)));
    ink(INK.navy, () => wline([[645, 600], [660, 720], [760, 760], [820, 790]], 3, 1111, 1));
    const dr = frac(lt * 2.2); ink(INK.teal, () => c.fill(blob(645, 610 + dr * 50, 6, 9, 1112, .5, 8)));
    const typ = Math.sin(lt * 28);
    niuma(900, 880, .92, { eyes: 'tired', lid: .62, mouth: 'flat', armL: 1.7 + typ * .15, armR: 1.75 - typ * .15, tilt: -.05, blush: 1 });
    // 带病身体 printed into a blister pack
    const bx = 330, by = 120;
    ink(INK.navy, () => c.fill(wrect(bx + 10, by + 12, 1260, 260, 1120, 2)), { a: .3, tone: [5, .35] });
    paperFill(() => c.fill(wrect(bx, by, 1260, 260, 1121, 2)));
    ink(INK.navy, () => { c.lineWidth = 4; c.stroke(wrect(bx, by, 1260, 260, 1121, 2)); });
    txt('什么', bx + 150, by + 130, 120, { col: INK.pink, col2: INK.navy, knock: 0, a: age(11, 0, t) > 0 ? 1 : 0 });
    for (let k = 2; k < 6; k++) {
      const cx = bx + 280 + (k - 2) * 240 + 110, cy = by + 130, a = age(11, k, t);
      ink(INK.blue, () => c.fill(blob(cx, cy, 100, 100, 1130 + k, 2)), { tone: [6, .35] });
      ink(INK.navy, () => { c.lineWidth = 4; c.stroke(blob(cx, cy, 100, 100, 1130 + k, 2)); });
      if (a > 0) txt(LY[11][0][k], cx, cy + 4, 150 * pop(a), { col: INK.navy, col2: INK.pink, knock: .1 });
    }
  }
  function eFaint(t, lt) {
    field(INK.navy, { over: 1 });
    // dizzy stars orbit
    for (let i = 0; i < 7; i++) { const a = lt * 3 + i / 7 * TAU; ink(INK.yel, () => c.fill(wpoly([...Array(10)].map((_, j) => { const r = j % 2 ? 14 : 34, q = j / 10 * TAU; return [960 + Math.cos(a) * 300 + Math.cos(q) * r, 640 + Math.sin(a) * 90 + Math.sin(q) * r]; }), 1200 + i, 1)), { over: 1 }); }
    // collapsed on the desk
    paperFill(() => c.fillRect(-10, 900, W + 20, 200));
    ink(INK.blue, () => c.fillRect(-10, 900, W + 20, 200), { tone: [8, .4] });
    c.save(); c.translate(960, 900); c.rotate(-Math.PI / 2 + .12);
    niuma(0, 0, 1.12, { eyes: 'spiral', mouth: 'o', armL: 3.0, armR: 2.6 });
    c.restore();
    // type: inverted ink (paper on navy), every char drunkenly tilting
    const each = (k, a) => ({ rot: Math.sin(lt * 4 + k * 1.1) * .22, dy: Math.sin(lt * 5 + k) * 22 });
    lyric(12, t, 960, 260, 205, { col: INK.yel, knock: 0, over: 1, each });
  }
  function eBoss(t, lt) {
    field(INK.paper, { over: 1 });
    const [sx, sy] = sh(t, 10 + 10 * onBeat(t), 30);
    // giant boss silhouette looming from the left
    const lean = .04 * Math.sin(lt * 5);
    c.save(); c.translate(400, 1100); c.rotate(lean);
    ink(INK.navy, () => { c.fill(wrect(-520, -560, 900, 700, 1300, 5)); c.fill(blob(-40, -760, 330, 270, 1301, 6)); }, { tone: [5, .5] });
    ink(INK.pink, () => c.fill(wpoly([[-60, -560], [60, -560], [40, -200], [0, -150], [-40, -200]], 1302, 3)));
    ink(INK.navy, () => { c.fill(wpoly([[-250, -900], [-110, -960], [-90, -900]], 1303, 3)); c.fill(wpoly([[170, -900], [30, -960], [10, -900]], 1304, 3)); });
    c.restore();
    // shout burst
    c.save(); c.translate(1230 + sx, 340 + sy);
    const n = 22, burst = [...Array(n)].map((_, i) => { const a = i / n * TAU, r = (i % 2 ? 300 : 420) * (1 + .06 * Math.sin(lt * 30 + i)); return [Math.cos(a) * r * 1.5, Math.sin(a) * r * .72]; });
    ink(INK.yel, () => c.fill(wpoly(burst, 1310, 6)));
    ink(INK.pink, () => { c.lineWidth = 10; c.stroke(wpoly(burst, 1310, 6)); });
    lyric(13, t, 0, 0, 175, { col: INK.navy, col2: INK.pink, knock: 0, each: (k, a) => ({ dx: sh(t + k, 6 * onBeat(t), 30)[0], dy: sh(t + k * 2, 6, 30)[1] }) });
    c.restore();
    // the hero bowing deep, tiny
    niuma(1500, 1010, .62, { lean: .95, eyes: 'closed', mouth: 'flat', sweat: 4, armL: .2, armR: .2 });
  }
  const EFN = [eRain, eHeat, eBus, eClient, eFever, eSick, eFaint, eBoss];

  // ticket card around each obstacle; the stack of earlier tickets thickens at the edges, the slam gets faster
  function drawCard(i, t) {
    const [t0, t1] = EW[i], lt = t - t0, sl = .30 - i * .025, k = clamp(lt / sl);
    const sideIn = i % 2 ? 1 : -1, rotEnd = (i % 2 ? 1 : -1) * (.008 + i * .003);
    const x = lerp(sideIn * 2100, 0, easeOut(k)), y = lerp(-300 - i * 30, 0, easeOut(k)), r = lerp(sideIn * (.3 + i * .05), rotEnd, easeOut(k));
    const sc = lerp(1.04, .93, easeOut(k)) + .006 * onBeat(t);
    c.save(); c.translate(960 + x, 540 + y); c.rotate(r); c.scale(sc, sc); c.translate(-960, -540);
    // drop shadow
    ink(INK.navy, () => c.fillRect(22, 26, W, H), { a: .5, tone: [5, .45] });
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
    paperFill(() => c.fillRect(0, 0, W, H));
    EFN[i](t, lt);
    // queue-ticket number in the corner
    paperFill(() => c.fillRect(W - 300, 24, 270, 84));
    ink(INK.navy, () => { c.lineWidth = 4; c.strokeRect(W - 300, 24, 270, 84); });
    digits('NO.0' + (i + 1), W - 165, 68, 58, INK.navy);
    c.restore();
    ink(INK.navy, () => { c.lineWidth = 6; c.strokeRect(0, 0, W, H); });
    c.restore();
  }
  function shotE(t) {
    // desk under the pile
    field(INK.navy, { over: 1 });
    field(INK.blue, { tone: [8, .4] });
    let cur = 0; for (let i = 0; i < 8; i++) if (t >= EW[i][0]) cur = i;
    // the pile: earlier tickets peek out, one more each time
    for (let j = 0; j < cur; j++) {
      const r = (h1(j * 5) - .5) * .09, dx = (h1(j * 7) - .5) * 60, dy = (h1(j * 3) - .5) * 40, sc = .93 + .01 * j;
      c.save(); c.translate(960 + dx, 540 + dy); c.rotate(r); c.scale(sc, sc); c.translate(-960, -540);
      paperFill(() => c.fillRect(0, 0, W, H));
      ink(CARD_BG[j], () => c.fillRect(0, 0, W, H), { tone: [10, .3] });
      ink(INK.navy, () => { c.lineWidth = 6; c.strokeRect(0, 0, W, H); });
      c.restore();
    }
    // previous card sits under the incoming one until it lands
    if (cur > 0 && t - EW[cur][0] < .32) drawCard(cur - 1, Math.min(t, EW[cur - 1][1] - .001));
    drawCard(cur, t);
    // beat flashes in the last four: the pressure builds
    if (cur >= 4) { const f = onBeat(t, 18) * (cur - 3) * .07; if (f > .02) paperFill(() => { c.globalAlpha = f; c.fillRect(0, 0, W, H); }); }
  }

  // F 29.94–33.2  都挡不住 / 小小牛马的 / 意志力 — he bursts up through the pile
  function shotF(t, lt) {
    field(INK.paper, { over: 1 });
    // rays
    const ray = seg(t, 31.9, 32.3);
    c.save(); c.translate(960, 720); c.rotate(lt * .25);
    ink(INK.yel, () => { for (let i = 0; i < 16; i++) { c.rotate(TAU / 16); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 2000, -.08, .08); c.fill(); } }, { a: .45 + .55 * ray });
    c.restore();
    // torn pile of tickets flying apart
    for (let j = 0; j < 8; j++) {
      const a = Math.max(0, t - 30.0), ang = -Math.PI / 2 + (j - 3.5) * .32, sp = 900 + 300 * h1(j);
      const x = 960 + Math.cos(ang) * sp * a, y = 860 + Math.sin(ang) * sp * a + 900 * a * a, r = (h1(j + 2) - .5) * 6 * a;
      c.save(); c.translate(x, y); c.rotate(r + (j - 3.5) * .05);
      paperFill(() => c.fill(wrect(-220, -130, 440, 260, 1400 + j, 5)));
      ink(CARD_BG[j], () => c.fill(wrect(-220, -130, 440, 260, 1400 + j, 5)), { tone: [8, .35] });
      ink(INK.navy, () => { c.lineWidth = 5; c.stroke(wrect(-220, -130, 440, 260, 1400 + j, 5)); });
      digits('NO.0' + (j + 1), 0, 0, 60, INK.navy);
      c.restore();
    }
    ink(INK.navy, () => c.fillRect(-10, 980, W + 20, 120));
    // hero: burst up (anticipation crouch → leap → land) then flex
    const jp = jump(t, 30.05, 30.55, 3);
    const flex = t > 31.9;
    niuma(960, 980 + jp.dy * 40, 1.0, { sq: jp.sq, eyes: flex ? 'fire' : 'wide', mouth: flex ? 'grit' : 'o', armR: flex ? 3.0 + Math.sin(t * 20) * .06 : 2.6, armL: flex ? 2.2 : 2.4, sweat: 1 });
    if (flex) ink(INK.pink, () => c.fill(blob(960 + 98, 980 - 168, 16, 13, 1450, 1.2)));   // the tiny bicep
    // 都挡不住: four stamps across the top
    [...'都挡不住'].forEach((ch, k) => { const a = age(14, k, t); if (a > 0) stamp(ch, 430 + k * 355, 210 - ray * 400, 200, a, { col: k % 2 ? INK.blue : INK.navy, rot: (k % 2 ? .05 : -.05) }); });
    // 小小牛马的: deliberately tiny, a label pointing at him
    const a0 = age(15, 0, t);
    if (a0 > 0) {
      ink(INK.navy, () => wline([[1180, 690], [1260, 640], [1300, 640]], 4, 1460));
      lyric(15, t, 1310, 640, 62, { align: 'left', font: 'NS', weight: 900, col: INK.navy, col2: INK.pink, knock: .2 });
    }
    // 意志力: enormous
    [...'意志力'].forEach((ch, k) => {
      const a = age(16, k, t); if (a <= 0) return;
      const p = a < .1 ? lerp(2.6, 1, easeIn(a / .1)) : 1 + .03 * Math.sin(a * 8 + k);
      txt(ch, 960 + (k - 1) * 440, 330, 400 * p, { col: INK.pink, col2: INK.navy, off: .03, knock: .1 });
    });
  }

  // G 33.2–37.0  为了三千 / 拼到底 — running on the receipt treadmill; then the copier scans 07:00 back in
  function shotG(t, lt) {
    field(INK.paper, { over: 1 });
    field(INK.pink, { tone: [12, .26] });
    // printer at right spitting an endless receipt that is the floor
    const v = 700 + 500 * seg(t, 34.5, 35);
    ink(INK.navy, () => c.fill(wrect(1640, 700, 320, 260, 1500, 3)));
    paperFill(() => c.fillRect(-20, 900, 1700, 90));
    ink(INK.navy, () => { c.lineWidth = 4; c.strokeRect(-20, 900, 1700, 90); });
    c.save(); c.beginPath(); c.rect(-20, 900, 1700, 90); c.clip();
    for (let i = 0; i < 8; i++) { const x = ((i * 300 - lt * v) % 2400 + 2400) % 2400 - 300; digits('¥3,100', x + 150, 945, 54, INK.navy); }
    c.restore();
    const fire = t > 34.5;
    niuma(980, 900, .9, { run: lt * (fire ? 4.2 : 2.6), lean: fire ? .26 : .14, eyes: fire ? 'fire' : 'tired', mouth: 'grit', sweat: fire ? 4 : 2 });
    // dust puffs behind
    for (let i = 0; i < 4; i++) { const a = frac(lt * 2 + i * .25); ink(INK.navy, () => c.fill(blob(860 - a * 400, 880 - a * 40, 30 + 40 * a, 20 + 30 * a, 1510 + i, 3)), { a: (1 - a) * .5, tone: [6, .4] }); }
    lyric(17, t, 960, 190, 170, { col: INK.navy, col2: INK.yel });
    [...'拼到底'].forEach((ch, k) => { const a = age(18, k, t); if (a > 0) stamp(ch, 580 + k * 380, 470, 230, a, { col: INK.pink, col2: INK.navy, rot: -.07 + k * .03 }); });
    // ending rhyme: the copier bar scans the next morning's 07:00 back over everything (36.05 → 36.6)
    if (t > 36.0) {
      const x = lerp(W + 240, -240, ease(seg(t, 36.0, 36.55)));
      c.save(); c.beginPath(); c.rect(x, 0, W, H); c.clip();
      field(INK.paper, { over: 1 });
      ink(INK.blue, () => c.fill(wrect(250, 230, 1420, 520, 11, 4)), { tone: [11, .38] });
      ink(INK.navy, () => { c.lineWidth = 14; c.stroke(wrect(250, 230, 1420, 520, 11, 4)); });
      if (frac(t * 2.4) < .6 || t > 36.6) digits('07:00', 968, 510, 470, INK.pink, { col2: INK.blue, off: .02 });
      niuma(960, 1060, .55, { eyes: 'closed', mouth: 'flat', tilt: .2 });
      c.restore();
      scanBar(x);
    }
  }

  // ------------------------------------------------------------------ shot list + seams
  const SH = [[0, shotA], [3.5, shotB], [7.2, shotC], [11.0, shotD], [14.8, shotE], [29.94, shotF], [33.2, shotG]];
  function frame(t) {
    BN = Math.floor(t * 12);
    let i = 0; while (i + 1 < SH.length && t >= SH[i + 1][0]) i++;
    const [t0, fn] = SH[i];
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.fillStyle = INK.paper; c.fillRect(0, 0, W, H);
    fn(t, t - t0);
    c.restore();
    // seams
    // A→B: copier bar wipes 3.3–3.7 (B appears behind the bar)
    if (t > 3.3 && t < 3.72) {
      const x = lerp(-240, W + 240, ease(seg(t, 3.3, 3.7)));
      if (t < 3.5) { c.save(); c.beginPath(); c.rect(0, 0, x, H); c.clip(); shotB(3.5, 0); c.restore(); }
      else { c.save(); c.beginPath(); c.rect(x, 0, W, H); c.clip(); shotA(3.49); c.restore(); }
      scanBar(x);
    }
    // B→C: whip pan smear (7.05–7.35)
    if (t > 7.05 && t < 7.35) {
      const k = seg(t, 7.05, 7.35);
      c.save(); c.globalCompositeOperation = 'multiply';
      for (let s = 0; s < 14; s++) { c.fillStyle = [INK.pink, INK.blue, INK.yel][s % 3]; c.globalAlpha = .55 * Math.sin(k * Math.PI); c.fillRect(0, s * 80 + (h1(s) - .5) * 40, W, 50 + 30 * h1(s + 4)); }
      c.restore();
    }
    // C→D: hard cut on the beat, with a stamp-flash
    if (t >= 11.0 && t < 11.12) paperFill(() => { c.globalAlpha = 1 - seg(t, 11.0, 11.12); c.fillRect(0, 0, W, H); });
    // E→F: white-hot burst
    if (t >= 29.94 && t < 30.12) paperFill(() => { c.globalAlpha = 1 - seg(t, 29.94, 30.12); c.fillRect(0, 0, W, H); });
    // F→G: copier bar right→left
    if (t > 33.05 && t < 33.4) {
      const x = lerp(W + 240, -240, ease(seg(t, 33.05, 33.4)));
      if (t < 33.2) { c.save(); c.beginPath(); c.rect(x, 0, W, H); c.clip(); shotG(33.2, 0); c.restore(); }
      else { c.save(); c.beginPath(); c.rect(0, 0, x, H); c.clip(); shotF(33.19, 33.19 - 29.94); c.restore(); }
      scanBar(x);
    }
  }

  shots([[0, (t) => { frame(t); }]]);
  window.MV = { LY, EW, SH };
})();
