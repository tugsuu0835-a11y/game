/* ===================================================================
 * Сүнсний зам — засвар (sunsenzam-fix.js)
 * Суулгах: index.html дээрх ГОЛ <script>-ийн дараа, </body>-ийн өмнө нэг мөр нэмнэ:
 *   <script src="sunsenzam-fix.js"></script>
 * Гол кодыг устгахгүй. Дараах функцүүдийг дахин тодорхойлж солино:
 *   buildScene (квадрат нүд), drawBoard (дүрийн байрлал), rollP (шинэ нүдний төрөл),
 *   render (попап, D14-ийг нэмж ороов). Мөн шинэ D14 шидэт шоо нэмнэ.
 * =================================================================== */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];

  /* ---------- 5. Нүд бүрийн даалгаврын өгөгдөл ---------- */
  const DARES = [
    'Сүнсний дуугаар 3 удаа хашгир.',
    'Нүдээ аниад 10 хүртэл тоолоод нээ.',
    'Хамгийн аймшигтай инээдээ инээ.',
    'Нэг хүнд аймшгийн түүх ярь.',
    '5 секунд хөдөлгөөнгүй зогсоод, дараа нь шуугиан тарь.',
    'Шулмын дуугаар "Хаха-ха" гэж 3 удаа инээ.'
  ];
  const TASKS = {
    fwd2:  { type: 'reward', title: 'Ид шидийн алхам', text: '2 нүд урагшилна.' },
    fwd3:  { type: 'reward', title: 'Сүнсний тусламж', text: '3 нүд урагшилна.' },
    fwd4:  { type: 'reward', title: 'Сарны гэрэл', text: '4 нүд урагшилна.' },
    fwd5:  { type: 'reward', title: 'Шулмын ивээл', text: '5 нүд урагшилна.' },
    roll:  { type: 'reward', title: 'Шидэт шоо', text: 'Дахин шоо хаяна.' },
    win:   { type: 'reward', title: 'Гарц', text: 'Гарцад хүрлээ!' },
    back2: { type: 'punish', title: 'Шийтгэлийн асуулт', text: 'Зөв хариулбал шийтгэлгүй, буруу бол 3 нүд ухрана.' },
    back3: { type: 'punish', title: 'Шийтгэлийн асуулт', text: 'Зөв хариулбал шийтгэлгүй, буруу бол 3 нүд ухрана.' },
    jail:  { type: 'punish', title: 'Гяндан', text: 'Нэг тойрог өнжинө.' },
    dare:  { type: 'punish', title: 'Гүйцэтгэх даалгавар', text: '' }
  };
  const REWARD = ['fwd2', 'fwd3', 'fwd4', 'fwd5', 'roll', 'win'];
  const FWD = { fwd2: 2, fwd3: 3, fwd4: 4, fwd5: 5 };
  const LBL = { fwd2: '+2', fwd3: '+3', fwd4: '+4', fwd5: '+5', roll: '↻', back2: '?', back3: '?', jail: 'Г', dare: '!', win: '★' };

  /* ---------- 3. Хоосон нүдгүй болгох: 500 шагнал / 500 шийтгэл ---------- */
  
/* ---------- 3. Нүдний хуваарилалт: 25% шагнал, 75% шийтгэл ---------- */

BOARD_KINDS[LAST] = 'win';

const pool = [];

for (let i = 0; i < TOTAL - 1; i++) {
  pool.push(i);
}

// Нүднүүдийг санамсаргүй холино
const rnd = mulberry32(777);

for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [pool[i], pool[j]] = [pool[j], pool[i]];
}

// 1000 нүдний хуваарилалт
// 249 шагнал + 500 асуулт + 250 бусад шийтгэл + 1 гарц
let pos = 0;

// 25% шагнал (гарцтай нийлээд 250)
const rewards = ['fwd2', 'fwd3', 'fwd4', 'fwd5', 'roll'];

for (let i = 0; i < 249; i++) {
  BOARD_KINDS[pool[pos++]] = rewards[i % rewards.length];
}

// 50% асуулттай шийтгэл
const questions = ['back2', 'back3'];

for (let i = 0; i < 500; i++) {
  BOARD_KINDS[pool[pos++]] = questions[i % questions.length];
}

// 25% бусад шийтгэл
const punishments = ['jail', 'dare'];

for (let i = 0; i < 250; i++) {
  BOARD_KINDS[pool[pos++]] = punishments[i % punishments.length];
}

// Даалгаврын мэдээлэл
const TILE_TASK = BOARD_KINDS.map((k, i) => {
  const t = TASKS[k];

  return {
    kind: k,
    type: t.type,
    title: t.title,
    text: k === 'dare'
      ? DARES[i % DARES.length]
      : t.text
  };
});

  const TILE_TASK = BOARD_KINDS.map((k, i) => {
    const t = TASKS[k];
    return { kind: k, type: t.type, title: t.title, text: k === 'dare' ? DARES[i % DARES.length] : t.text };
  });

  /* ---------- 1. Квадрат нүд (зам дээр эргэж, нүдний төвд байрлана) ---------- */
  const origBuild = buildScene;
  buildScene = function () {
    const cv = origBuild();
    const c = cv.getContext('2d');
    const S = 24, h = S / 2;
    BOARD_PTS.forEach((p, i) => {
      if (i === LAST) return;                      // гарцыг origBuild зурсан
      const q = BOARD_PTS[Math.max(0, i - 1)], n = BOARD_PTS[Math.min(LAST, i + 1)];
      const ang = Math.atan2(n.y - q.y, n.x - q.x);
      const t = TILE_TASK[i];
      const col = t.type === 'reward' ? '170,120,255' : '255,110,60';
      c.save();
      c.translate(p.x, p.y);
      c.rotate(ang);
      const g = c.createLinearGradient(0, -h, 0, h);
      g.addColorStop(0, '#3a3046');
      g.addColorStop(1, '#120c1a');
      c.fillStyle = g;
      c.fillRect(-h, -h, S, S);
      c.shadowColor = `rgba(${col},0.9)`;
      c.shadowBlur = 6;
      c.strokeStyle = `rgba(${col},0.95)`;
      c.lineWidth = 1.6;
      c.strokeRect(-h + 0.8, -h + 0.8, S - 1.6, S - 1.6);
      c.restore();
      c.save();
      c.fillStyle = '#fff';
      c.font = 'bold 10px Georgia,serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(i === 0 ? 'S' : LBL[t.kind], p.x, p.y + 1);
      c.restore();
    });
    return cv;
  };
  SCENE = null;                                    // шинэ талбайг дахин зуруулна

  /* ---------- 2. Дүрийг нүдний яг төвд байрлуулах ---------- */
  drawBoard = function () {
    if (!SCENE) SCENE = buildScene();
    const cv = $('board');
    if (cv.width !== WORLD.w) { cv.width = WORLD.w; cv.height = WORLD.h; }
    const ctx = cv.getContext('2d');
    ctx.drawImage(SCENE, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const n = G.players.length;
    G.players.forEach((pl, i) => {
      const c = pointAt(VIS[pl.id] ?? pl.pos);    // нүдний яг төв (зөвхөн бүхэл индекстэй үед)
      const sc = n > 1 ? 0.32 : 0.5;               // олон дүр байвал жижиглэнэ
      const a = -Math.PI / 2 + i * TAU / 5;
      const ox = n > 1 ? Math.cos(a) * 6.5 : 0;    // нэг нүдэнд хоорондоо зууралдахгүй байрлана
      const oy = n > 1 ? Math.sin(a) * 6.5 : 0;
      const x = c.x + ox;
      const y = c.y + oy + 9.5 * sc;               // дүрсний геометрийн төв = нүдний төв
      if (i === G.cur && G.status === 'playing') {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 13, 0, TAU);
        ctx.strokeStyle = '#fff';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      DRAW[pl.avatar](ctx, x, y, sc);
      ctx.font = 'bold 10px Georgia,serif';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.strokeText(pl.name, c.x + ox, c.y - 15);
      ctx.fillStyle = pl.color;
      ctx.fillText(pl.name, c.x + ox, c.y - 15);
    });
  };

  /* ---------- 4. Нүдэнд хүрсэн үед даалгавар идэвхжих (зөвхөн буух үед) ---------- */
  rollP = function (G, a, b) {
    if (G.status !== 'playing' || G.phase !== 'roll') return G;
    const s = clone(G);
    const p = s.players[s.cur];
    const t = a + b;
    s.dice = [a, b];
    s.rollId = (G.rollId || 0) + 1;
    p.pos = Math.min(p.pos + t, LAST);
    const note = `${p.name}: ${a}+${b}=${t}`;
    setFx(s, 'rattle');
    if (p.pos >= LAST) { winP(s, p); return s; }

    const task = TILE_TASK[p.pos];
    s.landId = (G.landId || 0) + 1;                // давтагдахгүй нэг удаагийн дугаар
    s.task = { id: s.landId, who: p.name, type: task.type, kind: task.kind, title: task.title, text: task.text };
    const k = task.kind;

    if (FWD[k]) {
      const steps = Math.min(FWD[k], 10 - s.bonus);
      if (steps <= 0) { nextTurn(s, note + ' · Бонусын хязгаар дууссан'); return s; }
      s.bonus += steps;
      p.pos = Math.min(p.pos + steps, LAST);
      if (p.pos >= LAST) { winP(s, p); return s; }
      setFx(s, 'chime');
      nextTurn(s, `${note} · ${pick(GOOD_MSG)} (+${steps})`);
      return s;
    }
    if (k === 'roll') {
      s.msg = `${note} · Дахин шоо хаях!`;
      return s;
    }
    if (k === 'back2' || k === 'back3') {
      s.phase = 'question';
      s.q = Math.floor(Math.random() * QUESTIONS.length);
      s.msg = `${note} · Шийтгэл! Асуултанд зөв хариулбал шийтгэлгүй`;
      setFx(s, 'bell');
      return s;
    }
    if (k === 'jail') {
      p.skip = true;
      setFx(s, 'laugh');
      nextTurn(s, `${note} · Гянданд хоригдлоо, нэг тойрог өнжинө`);
      return s;
    }
    setFx(s, 'bell');                              // dare
    nextTurn(s, `${note} · ${task.title}`);
    return s;
  };

  /* ---------- Даалгаврын попап ---------- */
  let shownTask = 0, pop = null, popT = 0;
  function showTask() {
    const t = G.task;
    if (!t || t.id === shownTask || pending > 0 || G.status === 'lobby') return;
    shownTask = t.id;
    if (t.kind === 'back2' || t.kind === 'back3') return;   // асуултын цонх өөрөө харагдана
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'taskPop';
      pop.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(88vw,380px);padding:22px 20px;border:2px solid;border-radius:16px;text-align:center;color:#f7ecd9;font-family:Georgia,serif;z-index:7;cursor:pointer';
      pop.onclick = () => { pop.hidden = true; clearTimeout(popT); };
      document.body.appendChild(pop);
    }
    const rew = t.type === 'reward';
    pop.style.background = rew ? 'radial-gradient(circle,#5b2fa8,#1c0f33)' : 'radial-gradient(circle,#9a2212,#2a0806)';
    pop.style.borderColor = rew ? '#b58cff' : '#ff8a3a';
    pop.style.boxShadow = rew ? '0 0 40px #9b6bff' : '0 0 40px #ff5a1f';
    pop.innerHTML =
      `<div style="font-size:12px;letter-spacing:3px;opacity:.85">${rew ? 'ШАГНАЛ' : 'ШИЙТГЭЛ'}</div>` +
      `<h3 style="margin:6px 0;font-size:22px;color:#ffd08a">${esc(t.title)}</h3>` +
      `<p style="margin:0;font-size:16px;line-height:1.4">${esc(t.who)}: ${esc(t.text)}</p>`;
    pop.hidden = false;
    playFx(rew ? 'chime' : 'bell');
    clearTimeout(popT);
    popT = setTimeout(() => { pop.hidden = true; }, 5000);
  }
  const baseRender = render;
  render = function () { baseRender(); showTask(); };

  /* ---------- 6. D14 шидэт шоо (3D, canvas) ---------- */
  // Heptagonal trapezohedron: 14 хажуу (kite). Оройнууд: 0 дээд орой, 1-7 дээд бүс, 8-14 доод бүс, 15 доод орой.
  const N = 7, UPZ = 0.22, APEX = 1, BOT = 15;
  const V = [[0, 0, APEX]];
  for (let k = 0; k < N; k++) V.push([Math.cos(TAU * k / N), Math.sin(TAU * k / N), UPZ]);
  for (let k = 0; k < N; k++) V.push([Math.cos(TAU * (k + 0.5) / N), Math.sin(TAU * (k + 0.5) / N), -UPZ]);
  V.push([0, 0, -APEX]);
  const U = k => 1 + (k % N), L = k => 8 + (k % N);
  const IDX = [];
  for (let k = 0; k < N; k++) IDX.push([0, U(k), L(k), U(k + 1)]);
  for (let k = 0; k < N; k++) IDX.push([BOT, L(k), U(k + 1), L(k + 1)]);

  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const unit = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  const FACES = IDX.map(ix => {
    const P = ix.map(j => V[j]);
    const c = [0, 1, 2].map(d => P.reduce((s, p) => s + p[d], 0) / 4);
    let n = unit(cross(sub(P[1], P[0]), sub(P[2], P[0])));
    if (dot(n, c) < 0) n = n.map(x => -x);       // гадагш чиглэсэн нормаль
    return { ix, n };
  });

  // Кватернион: [w, x, y, z]
  const qmul = (a, b) => [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]
  ];
  const qaxis = (ax, ang) => { const s = Math.sin(ang / 2); return [Math.cos(ang / 2), ax[0] * s, ax[1] * s, ax[2] * s]; };
  const qrot = (q, v) => {
    const r = qmul(qmul(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]);
    return [r[1], r[2], r[3]];
  };
  const qslerp = (a, b, t) => {
    let d = dot4(a, b), bb = b;
    if (d < 0) { bb = b.map(x => -x); d = -d; }
    if (d > 0.9995) return unit4(a.map((x, i) => x + t * (bb[i] - x)));
    const th = Math.acos(d), s = Math.sin(th);
    const wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
    return a.map((x, i) => wa * x + wb * bb[i]);
  };
  function dot4(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; }
  function unit4(v) { const l = Math.hypot(...v); return v.map(x => x / l); }
  // Нэгдүгээр нүүрний нормаль Z (камер) руу эргүүлэх кватернион
  function faceQuat(f) {
    const n = FACES[f].n, Z = [0, 0, 1];
    const ax = cross(n, Z), s = Math.hypot(...ax);
    const d = Math.max(-1, Math.min(1, dot(n, Z)));
    if (s < 1e-6) return d > 0 ? [1, 0, 0, 0] : qaxis([1, 0, 0], Math.PI);
    return qaxis(ax.map(x => x / s), Math.acos(d));
  }
  const randAxis = () => unit([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);

  const aside = document.querySelector('aside');
  const wrap = document.createElement('div');
  wrap.style.cssText = 'text-align:center;margin-bottom:8px';
  wrap.innerHTML =
    '<canvas id="d14" width="240" height="240" title="Дарж шидээрэй" style="width:200px;height:200px;cursor:pointer;display:block;margin:0 auto"></canvas>' +
    '<div id="d14lbl" style="color:#ffd08a;min-height:1.4em;text-shadow:0 0 10px #9b6bff">Шидэт D14 — дарж хаа</div>';
  aside.prepend(wrap);
  const cvs = wrap.querySelector('#d14');
  const ctx4 = cvs.getContext('2d');
  const lbl = wrap.querySelector('#d14lbl');
  cvs.onclick = rollD14;

  let Q = [1, 0, 0, 0], rolling = false;
  const PART = Array.from({ length: 18 }, () => ({
    x: Math.random() * 240, y: Math.random() * 240, s: 0.4 + Math.random() * 1.2, v: 0.2 + Math.random() * 0.5
  }));
  function proj(v) {
    const f = 1 / (1 - 0.18 * v[2]);
    return [120 + v[0] * 86 * f, 118 - v[1] * 86 * f, f];
  }
  function frame() {
    const g = ctx4;
    g.clearRect(0, 0, 240, 240);
    const hg = g.createRadialGradient(120, 120, 20, 120, 120, 120);
    hg.addColorStop(0, 'rgba(150,80,255,0.45)');
    hg.addColorStop(1, 'rgba(150,80,255,0)');
    g.fillStyle = hg;
    g.fillRect(0, 0, 240, 240);
    const sg = g.createRadialGradient(120, 212, 2, 120, 212, 70);
    sg.addColorStop(0, 'rgba(170,100,255,0.55)');
    sg.addColorStop(1, 'rgba(170,100,255,0)');
    g.fillStyle = sg;
    g.fillRect(0, 150, 240, 90);
    g.fillStyle = 'rgba(200,150,255,0.7)';
    for (const p of PART) {
      p.y -= p.v;
      if (p.y < -4) { p.y = 244; p.x = Math.random() * 240; }
      g.beginPath(); g.arc(p.x, p.y, p.s, 0, TAU); g.fill();
    }
    const W = V.map(v => qrot(Q, v));
    const order = FACES.map((F, i) => ({ i, z: F.ix.reduce((s, j) => s + W[j][2], 0) }))
      .sort((a, b) => a.z - b.z);
    for (const { i } of order) {
      const F = FACES[i];
      const nr = qrot(Q, F.n);
      if (nr[2] < -0.02) continue;                // ар тал харагдахгүй
      const P = F.ix.map(j => proj(W[j]));
      const lum = 0.2 + 0.8 * nr[2];
      g.beginPath();
      g.moveTo(P[0][0], P[0][1]);
      for (let k = 1; k < 4; k++) g.lineTo(P[k][0], P[k][1]);
      g.closePath();
      g.fillStyle = `rgb(${(12 + 30 * lum) | 0},${(8 + 12 * lum) | 0},${(22 + 64 * lum) | 0})`;
      g.fill();
      g.strokeStyle = `rgb(${(150 + 60 * lum) | 0},${(110 + 40 * lum) | 0},${(60 + 20 * lum) | 0})`;
      g.lineWidth = 1.6;
      g.stroke();
      // Төв дээр ромын тоо, алмаазан хүрээтэй
      const cen = [0, 1, 2].map(d => F.ix.reduce((s, j) => s + W[j][d], 0) / 4);
      const c2 = proj(cen);
      const fs = 11 * c2[2];
      g.save();
      g.translate(c2[0], c2[1]);
      g.strokeStyle = 'rgba(190,140,255,0.75)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, -fs * 1.1); g.lineTo(fs * 1.6, 0); g.lineTo(0, fs * 1.1); g.lineTo(-fs * 1.6, 0);
      g.closePath();
      g.stroke();
      g.fillStyle = '#e6d0ff';
      g.shadowColor = '#a46bff';
      g.shadowBlur = 8;
      g.font = `bold ${Math.round(fs)}px Georgia,serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(ROMAN[i + 1], 0, 0);
      g.restore();
    }
  }
  (function loop() { frame(); requestAnimationFrame(loop); })();

  // Шоо хаях: 1..14 бүгд тэнцүү магадлалтай (Math.random-аас бүхэл тоо)
  function rollD14() {
    if (rolling) return;
    rolling = true;
    const r = 1 + Math.floor(Math.random() * 14);
    const qf = faceQuat(r - 1);
    const q0 = qmul(qaxis(randAxis(), Math.random() * TAU), qaxis(randAxis(), Math.random() * TAU));
    const t0 = performance.now(), DUR = 2400;
    lbl.textContent = 'Эргэлдэж байна…';
    playFx('rattle');
    const step = now => {
      const e = Math.min(1, (now - t0) / DUR);
      const k = 1 - Math.pow(1 - e, 3);           // аажмаар удаашрах
      Q = qmul(qaxis([0, 0, 1], TAU * 3 * (1 - k)), qslerp(q0, qf, k));
      if (e < 1) {
        requestAnimationFrame(step);
      } else {
        Q = qf;
        rolling = false;
        lbl.textContent = `ШИДЭТ D14: ${ROMAN[r]} (${r})`;
        playFx('chime');
      }
    };
    requestAnimationFrame(step);
  }
})();
