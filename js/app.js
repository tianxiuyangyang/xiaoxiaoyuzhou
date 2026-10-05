/* ============================================================
   小小宇宙 · LITTLE UNIVERSE   （浅色版）
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand  = (a, b) => a + Math.random() * (b - a);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const body = document.body;
  const stage = $('#stage');
  const wall = $('#wall');
  const openZone = $('#openZone');
  const flash = $('#flash');
  const cursorGlow = $('#cursorGlow');
  const lightbox = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  const frames = $$('.frame-wrap');
  const frameBoxes = frames.map(f => $('.frame', f));

  /* ==========================================================
     音效（Web Audio 合成，音乐盒质感的清响）
     ========================================================== */
  let soundOn = localStorage.getItem('lu-sound') !== 'off';
  const soundBtn = $('#soundBtn');
  let ac = null;

  function applySoundUI() {
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    $('.sound-label', soundBtn).textContent = soundOn ? '音效' : '静音';
    localStorage.setItem('lu-sound', soundOn ? 'on' : 'off');
  }
  soundBtn.addEventListener('click', () => { soundOn = !soundOn; applySoundUI(); if (soundOn) bell(); });
  applySoundUI();

  function audio() {
    if (!soundOn) return null;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  function noise(ctx, dur) {
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    return buf;
  }
  function out(ctx, v) {
    const g = ctx.createGain();
    g.gain.value = v || .8;
    g.connect(ctx.destination);
    return g;
  }

  /* 开启：清亮的音乐盒 */
  function bell() {
    const ctx = audio(); if (!ctx) return;
    const t = ctx.currentTime + .02, master = out(ctx, .8);

    [659.25, 987.77, 1318.5, 1975.5].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime([.055, .035, .022, .01][i], t + .012 + i * .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + 2.2 - i * .3);
      o.connect(g).connect(master); o.start(t); o.stop(t + 2.4);
    });
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 164.81;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(.0001, t);
    g2.gain.exponentialRampToValueAtTime(.04, t + .06);
    g2.gain.exponentialRampToValueAtTime(.0001, t + 1.5);
    o2.connect(g2).connect(master); o2.start(t); o2.stop(t + 1.6);

    const src = ctx.createBufferSource(); src.buffer = noise(ctx, .9);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(5200, t + .45);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(.0001, t);
    ng.gain.exponentialRampToValueAtTime(.04, t + .08);
    ng.gain.exponentialRampToValueAtTime(.0001, t + .85);
    src.connect(bp).connect(ng).connect(master); src.start(t); src.stop(t + .9);
  }

  /* 收起：一声轻叹 */
  function soft() {
    const ctx = audio(); if (!ctx) return;
    const t = ctx.currentTime + .02, master = out(ctx, .8);
    [329.63, 493.88].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime([.042, .024][i], t + .02 + i * .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + 1.4 - i * .2);
      o.connect(g).connect(master); o.start(t); o.stop(t + 1.5);
    });
    const src = ctx.createBufferSource(); src.buffer = noise(ctx, .7);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(400, t + .6);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(.0001, t);
    ng.gain.exponentialRampToValueAtTime(.03, t + .07);
    ng.gain.exponentialRampToValueAtTime(.0001, t + .7);
    src.connect(lp).connect(ng).connect(master); src.start(t); src.stop(t + .8);
  }

  /* ==========================================================
     粒子（浅色底：用暖褐色系的实心微粒，而非发光叠加）
     ========================================================== */
  const canvas = $('#fx');
  const cx = canvas.getContext('2d');
  let W = 0, H = 0;
  const dust = [], parts = [], rings = [];

  const BRONZE = [168, 122, 74];
  const ROSE   = [201, 132, 122];
  const SKY    = [122, 148, 178];
  const UMBER  = [140, 120, 98];
  const TINTS = { b: BRONZE, r: ROSE, s: SKY, u: UMBER };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedDust();
  }

  function seedDust() {
    dust.length = 0;
    const n = Math.round(clamp((W * H) / 21000, 40, 140));
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      dust.push({
        x: Math.random() * W, y: Math.random() * H,
        r: rand(.4, 1.9), vx: rand(-.007, .007), vy: rand(-.013, -.002),
        a: rand(.16, .48), ph: rand(0, 6.283), sp: rand(.4, 1.3),
        t: r < .5 ? 'b' : (r < .78 ? 'u' : (r < .92 ? 'r' : 's'))
      });
    }
  }

  function burst(x, y, n = 90, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(.4, 6.2) * power;
      const r = Math.random();
      parts.push({
        x: x + rand(-12, 12), y: y + rand(-12, 12),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(.1, 1.6),
        life: 0, max: rand(700, 1900), r: rand(.6, 2.6),
        t: r < .42 ? 'b' : (r < .74 ? 'r' : (r < .9 ? 'u' : 's'))
      });
    }
  }

  function ripple(x, y, delay = 0) {
    rings.push({ x, y, r: 0, vr: .38, life: -delay, max: 1500, w: 1.4 });
  }

  function shatter() {
    $$('.ch').forEach(el => {
      const r = el.getBoundingClientRect();
      const mx = r.left + r.width / 2, my = r.top + r.height / 2;
      const count = Math.round(clamp((r.width * r.height) / 620, 26, 130));
      for (let i = 0; i < count; i++) {
        const px = rand(r.left, r.right), py = rand(r.top, r.bottom);
        const dx = px - mx, dy = py - my;
        const d = Math.hypot(dx, dy) || 1;
        const sp = rand(.35, 2.3);
        parts.push({
          x: px, y: py,
          vx: dx / d * sp + rand(-.6, .6), vy: dy / d * sp - rand(.2, 1.6),
          life: 0, max: rand(900, 2100), r: rand(.6, 2.2),
          t: Math.random() < .55 ? 'b' : 'r'
        });
      }
    });
  }

  /* 光尘归拢 */
  function converge() {
    const cxp = W / 2, cyp = H * .46;
    for (let i = 0; i < 150; i++) {
      const a = Math.random() * Math.PI * 2;
      const R = rand(240, Math.max(320, Math.min(W, H) * .62));
      const px = cxp + Math.cos(a) * R, py = cyp + Math.sin(a) * R;
      const d = Math.hypot(cxp - px, cyp - py) || 1;
      const sp = rand(1.5, 4.2);
      parts.push({
        x: px, y: py,
        vx: (cxp - px) / d * sp, vy: (cyp - py) / d * sp,
        life: 0, max: rand(900, 1700), r: rand(.6, 2.1),
        t: Math.random() < .6 ? 'b' : 's'
      });
    }
    ripple(cxp, cyp);
  }

  let px = 0, py = 0, tx = 0, ty = 0;
  let last = performance.now();

  function loop(now) {
    const dt = Math.min(now - last, 48); last = now;
    const k = dt / 16.67;

    cx.clearRect(0, 0, W, H);

    /* 浮尘 */
    for (const p of dust) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.ph += dt * .001 * p.sp;
      if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
      if (p.x < -12) p.x = W + 12; else if (p.x > W + 12) p.x = -12;
      const tw = .55 + .45 * Math.sin(p.ph);
      const c = TINTS[p.t];
      cx.beginPath();
      cx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(p.a * tw).toFixed(3)})`;
      cx.arc(p.x, p.y, p.r, 0, 6.2832);
      cx.fill();
    }

    /* 波纹 */
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life += dt;
      if (r.life < 0) continue;
      r.r += r.vr * dt * (1 + r.r / 420);
      const t = r.life / r.max;
      if (t >= 1) { rings.splice(i, 1); continue; }
      const a = Math.pow(1 - t, 2.4) * .42;
      cx.beginPath();
      cx.strokeStyle = `rgba(168,122,74,${a.toFixed(3)})`;
      cx.lineWidth = Math.max(.2, r.w * (1 - t));
      cx.arc(r.x, r.y, r.r, 0, 6.2832);
      cx.stroke();
    }

    /* 光粒 */
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      const t = p.life / p.max;
      if (t >= 1) { parts.splice(i, 1); continue; }
      p.vy += .012 * k;
      p.vx *= Math.pow(.985, k); p.vy *= Math.pow(.985, k);
      p.x += p.vx * k; p.y += p.vy * k;
      const a = (t < .12 ? t / .12 : Math.pow(1 - (t - .12) / .88, 1.7)) * .82;
      const c = TINTS[p.t];
      cx.beginPath();
      cx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
      cx.arc(p.x, p.y, p.r * (1 - t * .45), 0, 6.2832);
      cx.fill();
    }

    /* 视差 */
    px += (tx - px) * .055; py += (ty - py) * .055;
    if (!reduced) {
      if (!opened) {
        stage.style.transform = `translate3d(${(-px * 12).toFixed(2)}px,${(-py * 8).toFixed(2)}px,0)`;
      } else if (body.classList.contains('show-wall')) {
        frameBoxes.forEach((el, i) => {
          const dir = i % 2 === 0 ? 1 : -1;
          el.style.transform =
            `perspective(1600px) rotateY(${(px * 5 * dir).toFixed(2)}deg)` +
            ` rotateX(${(-py * 3.4).toFixed(2)}deg) translateZ(10px)`;
        });
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ==========================================================
     指针
     ========================================================== */
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine) {
    window.addEventListener('pointermove', e => {
      tx = (e.clientX / W) * 2 - 1;
      ty = (e.clientY / H) * 2 - 1;
      body.classList.add('has-pointer');
      cursorGlow.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
      if (opened) {
        frames.forEach(f => {
          const r = f.getBoundingClientRect();
          const gl = $('.gloss', f);
          if (gl) {
            gl.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
            gl.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
          }
        });
      }
    }, { passive: true });
  }

  /* ==========================================================
     开启 / 收起
     ========================================================== */
  let opened = false, busy = false;

  function open(x, y) {
    if (opened || busy) return;
    opened = true; busy = true;

    flash.style.setProperty('--fx', x + 'px');
    flash.style.setProperty('--fy', y + 'px');
    flash.classList.remove('fire'); void flash.offsetWidth; flash.classList.add('fire');

    bell();
    burst(x, y, 110, 1.3);
    ripple(x, y); ripple(x, y, 160); ripple(x, y, 340);
    setTimeout(() => burst(x, y, 60, .75), 220);

    stage.classList.add('is-shattering');
    shatter();

    setTimeout(() => {
      body.classList.add('show-wall');
      wall.setAttribute('aria-hidden', 'false');
    }, 600);

    setTimeout(() => body.classList.add('wall-settled'), 3600);

    setTimeout(() => {
      stage.classList.add('is-gone');
      busy = false;
    }, 1700);
  }

  function close() {
    if (!opened || busy) return;
    busy = true;
    body.classList.add('leaving');
    soft();
    converge();

    setTimeout(() => {
      body.classList.remove('show-wall', 'leaving', 'wall-settled');
      wall.setAttribute('aria-hidden', 'true');
      stage.classList.remove('is-gone');
      void stage.offsetWidth;
      stage.classList.remove('is-shattering');
      stage.classList.add('is-returning');
      setTimeout(() => stage.classList.remove('is-returning'), 1400);
      opened = false; busy = false;
    }, 820);
  }

  openZone.addEventListener('click', e => {
    open(e.clientX || W / 2, e.clientY || H / 2);
  });
  window.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !opened && !busy) { e.preventDefault(); open(W / 2, H * .5); }
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLB();
  });
  $('#reset').addEventListener('click', close);

  /* ==========================================================
     大图
     ========================================================== */
  function openLB(src, cap) {
    lbImg.src = src; lbImg.alt = cap || '';
    lbCap.textContent = cap || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    body.classList.add('lb-open');
  }
  function closeLB() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    body.classList.remove('lb-open');
  }
  frames.forEach(f => {
    f.addEventListener('click', () => openLB(f.dataset.src, f.dataset.cap));
  });
  $$('[data-close]').forEach(el => el.addEventListener('click', closeLB));

  /* ==========================================================
     启动
     ========================================================== */
  resize();
  window.addEventListener('resize', resize);

  const preload = Promise.all(frames.map(f => new Promise(res => {
    const img = new Image();
    img.onload = img.onerror = res;
    img.src = f.dataset.src;
  })));
  Promise.all([preload, new Promise(r => setTimeout(r, 620))]).then(() => {
    $('#loader').classList.add('done');
    body.classList.remove('is-loading');
    if (location.hash === '#open') setTimeout(() => open(W / 2, H * .5), 500);
  });
  setTimeout(() => { $('#loader').classList.add('done'); body.classList.remove('is-loading'); }, 2600);
})();
