window.NO_LIGHT = true;
(() => {
  const roll = window.ROLL || [];
  const stage = document.getElementById('stage');
  const intro = document.getElementById('intro');
  const cv = document.getElementById('light');
  const ctx = cv.getContext('2d');
  const cur = document.getElementById('cursor');
  const count = document.getElementById('count');
  const cap = document.getElementById('cap');
  const hint = document.getElementById('hint');
  const spec = document.getElementById('spec');
  const specdata = document.getElementById('specdata');
  const coarse = matchMedia('(pointer:coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const pad = n => String(n).padStart(2, '0');

  // ---- frames ----
  const frames = roll.map((r, i) => {
    const f = document.createElement('div');
    f.className = 'frame' + (r.fit === 'contain' ? ' contain' : '');
    const phone = matchMedia('(max-width:760px)').matches;
    if (phone && r.mfit) f.classList.add(r.mfit === 'contain' ? 'contain' : 'cover');
    if (r.video) {
      const v = document.createElement('video');
      v.muted = true; v.loop = false; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = i < 1 ? 'auto' : 'none';
      if (r.poster) v.poster = r.poster;
      v.src = (phone && r.mvideo) || r.video; if (phone && r.mpos) v.style.objectPosition = r.mpos; if (phone && r.mposter) v.poster = r.mposter; if (r.color) v.style.filter = 'none';
      v.addEventListener('ended', () => {
        if (!f.classList.contains('on')) return;
        v._n = (v._n || 0) + 1;
        if (v._n < (r.plays || 1)) { v.currentTime = 0; v.play().catch(() => {}); return; }
        const total = frames.length; show(idx + 1 >= total ? 1 : idx + 2);
      });
      f.appendChild(v); f.dataset.video = '1'; stage.appendChild(f); return f;
    }
    const img = new Image();
    img.alt = [r.place, r.year].filter(Boolean).join(', ');
    img.decoding = 'async';
    img.loading = i < 2 ? 'eager' : 'lazy';
    img.onerror = () => { img.remove(); const m = document.createElement('div'); m.className = 'missing'; m.textContent = '[ frame ' + pad(i + 1) + ' ]'; f.appendChild(m); };
    img.src = r.src; if (r.color) img.style.filter = 'none';
    f.appendChild(img);
    stage.appendChild(f);
    return f;
  });

  let idx = -1, showT; // -1 = intro
  function show(n) {
    const total = frames.length;
    if (!total) return;
    n = ((n % (total + 1)) + (total + 1)) % (total + 1) - 1; // cycles intro -> frames -> intro
    const prev = idx < 0 ? intro : frames[idx];
    const next = n < 0 ? intro : frames[n];
    clearTimeout(showT);
    [intro, ...frames].forEach(f => { if (f !== prev) f.classList.remove('on'); });
    prev.classList.remove('on');
    frames.forEach(f => { const v = f.querySelector('video'); if (v && f !== prev) v.pause(); });
    const pv = prev.querySelector('video'); if (pv) setTimeout(() => { if (!pv.parentNode.classList.contains('on')) pv.pause(); }, 1400);
    showT = setTimeout(() => next.classList.add('on'), 250);
    const nv = next.querySelector('video'); if (nv) { nv._n = 0; nv.currentTime = 0; nv.play().catch(() => {}); }
    idx = n;
    if (n >= 0 && frames[n + 1]) { const im = frames[n + 1].querySelector('img'); if (im) im.loading = 'eager'; const nv2 = frames[n + 1].querySelector('video'); if (nv2) nv2.preload = 'auto'; }
    const r = n >= 0 ? roll[n] : null;
    count.textContent = n < 0 ? '00 / ' + pad(total) : pad(n + 1) + ' / ' + pad(total);
    cap.textContent = r ? [r.place, r.year].filter(Boolean).join(' · ') : '';
    hint.style.opacity = n < 0 ? 1 : 0;
    document.body.classList.toggle('intro-on', n < 0);
    document.getElementById('advn').textContent = n + 2 > total ? '00' : pad(n + 2);
    document.getElementById('prv').classList.toggle('on', n >= 0);
    // the light grows through the roll; last frame is first light
    target.dark = n < 0 ? 0.97 : 0.96 - 0.42 * (n / Math.max(1, total - 1));
    if (r) setTimeout(() => flashSpec(r, n), 1300);
    if (window.tkTone && n >= 0) window.tkTone(n);
    else spec.classList.remove('on');
  }

  // ---- spec marks ----
  let specT;
  function flashSpec(r, n) {
    if (!r) return;
    specdata.innerHTML = ['TK—' + pad(n + 1), r.place, r.year, r.note].filter(Boolean).map(s => `<div>${s}</div>`).join('');
    spec.classList.remove('flick'); void spec.offsetWidth;
    spec.classList.add('on', 'flick');
    clearTimeout(specT); specT = setTimeout(() => spec.classList.remove('on'), 2600);
  }

  // ---- the light: a stage fixture hung above, on a pan rig ----
  let W, H, dpr;
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener('resize', size);

  // haze texture (soft value noise), drawn once
  const fog = document.createElement('canvas'); fog.width = fog.height = 256;
  (() => {
    const f = fog.getContext('2d'), g = 16, v = [];
    for (let i = 0; i < (g + 1) * (g + 1); i++) v.push(Math.random());
    const id = f.createImageData(256, 256);
    const sm = t => t * t * (3 - 2 * t);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const gx = x / 256 * g, gy = y / 256 * g, ix = gx | 0, iy = gy | 0, fx = sm(gx - ix), fy = sm(gy - iy);
      const at = (a, b) => v[((b % g) * (g + 1)) + (a % g)];
      const n = (at(ix, iy) * (1 - fx) + at(ix + 1, iy) * fx) * (1 - fy) + (at(ix, iy + 1) * (1 - fx) + at(ix + 1, iy + 1) * fx) * fy;
      const o = (y * 256 + x) * 4; id.data[o] = id.data[o + 1] = id.data[o + 2] = 255; id.data[o + 3] = Math.pow(n, 2.2) * 255;
    }
    f.putImageData(id, 0, 0);
    const c2 = document.createElement('canvas'); c2.width = c2.height = 256; const f2 = c2.getContext('2d');
    for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) { f2.filter = 'blur(7px)'; f2.drawImage(fog, dx, dy); }
    f.clearRect(0, 0, 256, 256); f.drawImage(c2, 0, 0);
  })();
  const fogL = document.createElement('canvas'); const fctx = fogL.getContext('2d');
  const fogPat = ctx.createPattern(fog, 'repeat');
  fogL.width = W; fogL.height = H;
  // smoke: soft puffs that drift and rise, lit only where the light reaches
  const smk = document.createElement('canvas'); const sctx = smk.getContext('2d');
  const puff = document.createElement('canvas'); puff.width = puff.height = 256;
  (() => { const p = puff.getContext('2d'); p.drawImage(fog, 0, 0, 256, 256); p.globalCompositeOperation = 'destination-in';
    const g = p.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); p.fillStyle = g; p.fillRect(0, 0, 256, 256); })();
  const puffs = Array.from({ length: 14 }, () => ({ x: Math.random(), y: 0.45 + Math.random() * 0.6, s: 0.35 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.00006, vy: -0.00002 - Math.random() * 0.00004, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.0002, a: 0.4 + Math.random() * 0.6 }));
  addEventListener('resize', () => { fogL.width = W; fogL.height = H; });

  const pos = { x: innerWidth / 2, y: innerHeight * 0.58, vx: 0, vy: 0 };
  const aim = { x: pos.x, y: pos.y };
  const L = { dark: 0.97, power: 0, iris: 0.3, focus: 0, k: 3200 };
  const target = { dark: 0.97, power: 1, iris: 0.3, focus: 0 };
  const dust = Array.from({ length: 90 }, () => ({ t: Math.random(), s: Math.random() * 2 - 1, v: 0.0004 + Math.random() * 0.0012, a: 0.12 + Math.random() * 0.4, z: Math.random() }));
  let moved = false, idleT, last = { x: 0, y: 0, t: 0 }, speed = 0;

  addEventListener('pointermove', e => {
    aim.x = e.clientX; aim.y = e.clientY; moved = true;
    const now = performance.now(), d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
    speed = Math.min(3, d / Math.max(8, now - last.t)); last = { x: e.clientX, y: e.clientY, t: now };
    cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    cur.style.opacity = 1;
    clearTimeout(idleT);
    idleT = setTimeout(() => { if (idx >= 0) flashSpec(roll[idx], idx); }, 1600);
  });
  document.addEventListener('pointerleave', () => { cur.style.opacity = 0; });
  // scroll = iris
  if (!window.NO_LIGHT) addEventListener('wheel', e => {
    if (e.target.closest('.win')) return;
    e.preventDefault();
    target.iris = Math.max(0.12, Math.min(0.62, target.iris + e.deltaY * -0.0006));
    showIris();
  }, { passive: false });
  // press and hold = focus: the beam tightens, brightens, the ring sharpens
  let holdT, held = false;
  addEventListener('pointerdown', e => {
    if (e.target.closest('.win, header, a, button')) return;
    held = false;
    holdT = setTimeout(() => { held = true; target.focus = 1; cur.classList.add('big'); }, 220);
  });
  addEventListener('pointerup', () => { clearTimeout(holdT); target.focus = 0; cur.classList.remove('big'); });

  const irisEl = document.createElement('div'); irisEl.className = 'iris ui'; document.body.appendChild(irisEl);
  let irisT;
  function showIris() {
    const deg = Math.round(8 + (L.iris - 0.12) / 0.5 * 42);
    irisEl.textContent = `Spread ${pad(deg)}°`;
    irisEl.classList.add('on'); clearTimeout(irisT); irisT = setTimeout(() => irisEl.classList.remove('on'), 1400);
  }

  let t0 = performance.now(), born = t0;
  // a rig of fixtures across the top; their beams converge where the visitor points
  const RIG = [0.08, 0.27, 0.5, 0.73, 0.92].map((x, i) => ({ x, ph: i * 1.7, sp: 0.7 + i * 0.13, on: 300 + i * 260 }));
  const beamPath = (c, x0, y0, tx, ty, w0, w1) => {
    const a = Math.atan2(ty - y0, tx - x0) + Math.PI / 2, cx = Math.cos(a), cy = Math.sin(a);
    c.beginPath(); c.moveTo(x0 - cx * w0, y0 - cy * w0); c.lineTo(x0 + cx * w0, y0 + cy * w0);
    c.lineTo(tx + cx * w1, ty + cy * w1); c.lineTo(tx - cx * w1, ty - cy * w1); c.closePath();
  };
  function draw(now) {
    if (window.NO_LIGHT) {
      // smoke only: slow haze drifting up through the film
      const dt0 = Math.min(50, now - t0); t0 = now;
      const SW = W >> 1, SH = H >> 1; if (smk.width !== SW) smk.width = SW; if (smk.height !== SH) smk.height = SH;
      sctx.globalCompositeOperation = 'source-over'; sctx.clearRect(0, 0, SW, SH);
      const b2 = Math.min(SW, SH);
      for (const q of puffs) {
        q.x += q.vx * dt0; q.y += q.vy * dt0 * 1.4; q.r += q.vr * dt0;
        if (q.y < -0.1) { q.y = 1.15; q.x = Math.random(); }
        const sz = b2 * q.s * 1.8;
        sctx.save(); sctx.translate(q.x * SW, q.y * SH); sctx.rotate(q.r); sctx.globalAlpha = q.a; sctx.drawImage(puff, -sz / 2, -sz / 2, sz, sz); sctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 0.07; ctx.drawImage(smk, 0, 0, W, H); ctx.globalAlpha = 1;
      requestAnimationFrame(draw); return;
    }
    const dt = Math.min(50, now - t0); t0 = now; const s = dt / 16;
    if (coarse && !moved) { aim.x = W / 2 + Math.sin(now / 3200) * W * 0.18; aim.y = H * 0.55 + Math.cos(now / 4100) * H * 0.08; }
    const stiff = reduce ? 1 : 0.02, damp = reduce ? 0 : 0.82;
    pos.vx = (pos.vx + (aim.x - pos.x) * stiff * s) * Math.pow(damp, s);
    pos.vy = (pos.vy + (aim.y - pos.y) * stiff * s) * Math.pow(damp, s);
    pos.x += pos.vx * s; pos.y += pos.vy * s;
    if (reduce) { pos.x = aim.x; pos.y = aim.y; }
    L.dark += (target.dark - L.dark) * Math.min(1, dt / 900);
    L.power += (target.power - L.power) * Math.min(1, dt / 700);
    L.iris += (target.iris - L.iris) * Math.min(1, dt / 220);
    L.focus += (target.focus - L.focus) * Math.min(1, dt / 160);
    const age = now - born;
    const p = L.power;
    const spread = (1 - L.focus) * Math.min(W, H) * (0.05 + L.iris * 0.5); // how far apart the beams land
    const wEnd = Math.max(10, Math.min(W, H) * L.iris * 0.22 * (1 - L.focus * 0.5)); // beam width at the floor

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = `rgba(0,0,0,${L.dark})`; ctx.fillRect(0, 0, W, H);

    // smoke field (drifting puffs)
    if (smk.width !== W) smk.width = W; if (smk.height !== H) smk.height = H;
    sctx.globalCompositeOperation = 'source-over'; sctx.clearRect(0, 0, W, H);
    const b2 = Math.min(W, H);
    for (const q of puffs) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt;
      if (q.y < 0.1) { q.y = 1.05; q.x = Math.random(); }
      const sz = b2 * q.s * 1.5;
      sctx.save(); sctx.translate(q.x * W, q.y * H); sctx.rotate(q.r); sctx.globalAlpha = q.a; sctx.drawImage(puff, -sz / 2, -sz / 2, sz, sz); sctx.restore();
    }

    const beams = RIG.map((f, i) => {
      if (age < f.on) return null;
      const flick = age < f.on + 500 ? (Math.random() < 0.3 ? 0.2 : 1) : 1;
      const sway = Math.sin(now / 1000 * f.sp * 0.6 + f.ph);
      const tx = pos.x + ((i - 2) / 2) * spread + sway * spread * 0.25;
      const ty = pos.y + Math.cos(now / 1300 * f.sp + f.ph) * spread * 0.12;
      const k2 = (H + 60 - -10) / Math.max(40, ty + 10); // run the beam on past the point, to the floor
      const fx = f.x * W + (tx - f.x * W) * k2, fy = H + 60;
      return { x0: f.x * W, y0: -10, tx, ty, fx, fy, fw: wEnd * k2, k: flick };
    }).filter(Boolean);

    // 1. reveal the image along each beam and where they land
    ctx.globalCompositeOperation = 'destination-out';
    for (const bm of beams) {
      const g = ctx.createLinearGradient(bm.x0, bm.y0, bm.fx, bm.fy); const m = Math.min(0.95, Math.hypot(bm.tx - bm.x0, bm.ty - bm.y0) / Math.hypot(bm.fx - bm.x0, bm.fy - bm.y0));
      g.addColorStop(0, `rgba(0,0,0,${0.25 * p * bm.k})`); g.addColorStop(m, `rgba(0,0,0,${0.5 * p * bm.k})`); g.addColorStop(Math.min(1, m + 0.15), `rgba(0,0,0,${0.08 * p * bm.k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; beamPath(ctx, bm.x0, bm.y0, bm.fx, bm.fy, 2, bm.fw); ctx.fill();
      const pg = ctx.createRadialGradient(bm.tx, bm.ty, 0, bm.tx, bm.ty, wEnd * 1.2);
      pg.addColorStop(0, `rgba(0,0,0,${0.3 * p * bm.k})`); pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(bm.tx, bm.ty, wEnd * 1.2, wEnd * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }

    // 2. the shafts themselves: thin, hard light with smoke moving through them
    ctx.globalCompositeOperation = 'lighter';
    for (const bm of beams) {
      const g = ctx.createLinearGradient(bm.x0, bm.y0, bm.fx, bm.fy); const m2 = Math.min(0.95, Math.hypot(bm.tx - bm.x0, bm.ty - bm.y0) / Math.hypot(bm.fx - bm.x0, bm.fy - bm.y0));
      g.addColorStop(0, `rgba(255,250,240,${0.14 * p * bm.k})`); g.addColorStop(m2, `rgba(255,250,240,${0.035 * p * bm.k})`); g.addColorStop(Math.min(1, m2 + 0.2), 'rgba(255,250,240,0)'); g.addColorStop(1, 'rgba(255,250,240,0)');
      ctx.fillStyle = g; beamPath(ctx, bm.x0, bm.y0, bm.fx, bm.fy, 1.5, bm.fw); ctx.fill();
      ctx.save(); beamPath(ctx, bm.x0, bm.y0, bm.fx, bm.fy, 1.5, bm.fw); ctx.clip();
      ctx.globalAlpha = 0.18 * p * bm.k; ctx.drawImage(smk, 0, 0, W, H); ctx.restore();
      // bright edge line down one side of each shaft
      ctx.strokeStyle = `rgba(255,255,255,${0.10 * p * bm.k})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bm.x0, bm.y0); ctx.lineTo(bm.fx, bm.fy); ctx.stroke();
      // source
      const sg = ctx.createRadialGradient(bm.x0, 0, 0, bm.x0, 0, 26);
      sg.addColorStop(0, `rgba(255,255,255,${0.6 * p * bm.k})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(bm.x0 - 26, 0, 52, 26);
    }
    // faint smoke everywhere so the dark has air in it
    ctx.globalAlpha = 0.05 * p; ctx.drawImage(smk, 0, 0, W, H); ctx.globalAlpha = 1;

    // 3. shadow: dark bands where beams cross the haze, and the dot's shadow cast away from the centre rig
    ctx.globalCompositeOperation = 'source-over';
    const cx0 = W / 2, sx = pos.x - cx0, sy = pos.y + 10, sl = Math.hypot(sx, sy) || 1;
    ctx.save(); ctx.translate(pos.x + sx / sl * 40, pos.y + sy / sl * 14); ctx.rotate(Math.atan2(sy, sx));
    const shg = ctx.createRadialGradient(0, 0, 0, 0, 0, 80); shg.addColorStop(0, `rgba(0,0,0,${0.5 * p})`); shg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.scale(1, 0.15); ctx.fillStyle = shg; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // ---- advance ----
  function onStage(e) { return !e.target.closest('.win, header, a, button'); }
  addEventListener('click', e => { if (held) { held = false; return; } if (!onStage(e)) return; const open = [...document.querySelectorAll('.win.open')]; if (open.length) { open.forEach(closeWin); return; } show(idx + 2); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { document.querySelectorAll('.win.open').forEach(w => closeWin(w)); return; }
    if (e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); show(idx + 2); }
    if (e.key === 'ArrowLeft') show(idx);
  });
  let sx = null;
  addEventListener('touchstart', e => { sx = e.touches[0].clientX; aim.x = e.touches[0].clientX; aim.y = e.touches[0].clientY; moved = true; }, { passive: true });
  addEventListener('touchend', e => {
    if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50 && onStage(e)) show(dx < 0 ? idx + 2 : idx);
  }, { passive: true });
  document.getElementById('home').addEventListener('click', () => switchTo(() => document.getElementById('win-about').classList.contains('open'), () => openWin('about')));

  // ---- windows ----
  let z = 10;
  function openWin(name) {
    const w = document.getElementById('win-' + name);
    if (!w) return;
    clearTimeout(w._ct);
    if (w.classList.contains('open') && !w.classList.contains('closing')) { w.style.zIndex = ++z; return; }
    w.hidden = false; w.classList.remove('closing'); document.body.classList.add('win-on'); w.style.zIndex = ++z;
    const from = window.DESK_FROM; window.DESK_FROM = null;
    w._icon = from ? from.el : null;
    if (from) w.dataset.o = from.id; else if (name === 'about') w.dataset.o = 0;
    if (from && !reduce) {
      w.getAnimations().forEach(a => a.cancel());
      w.classList.add('fromicon', 'open');
      const k = iconDelta(w, from.el);
      w.animate([
        { transform: 'translate(-50%,-50%) translate(' + k.dx + 'px,' + k.dy + 'px) scale(' + k.s + ')', opacity: 0, borderRadius: '14px' },
        { opacity: 1, offset: .3 },
        { transform: 'translate(-50%,-50%)', opacity: 1, borderRadius: '2px' }
      ], { duration: 560, easing: 'cubic-bezier(.16,.84,.24,1)' });
      return;
    }
    w.classList.remove('fromicon');
    requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('open')));
  }
  function iconDelta(w, el) {
    const wr = w.getBoundingClientRect(), ir = (el.querySelector('canvas') || el).getBoundingClientRect();
    return { dx: (ir.left + ir.width / 2) - (wr.left + wr.width / 2), dy: (ir.top + ir.height / 2) - (wr.top + wr.height / 2), s: Math.max(ir.width / wr.width, .02) };
  }
  function closeWin(w) {
    w.querySelectorAll('video').forEach(v => v.pause());
    if (w._icon && !reduce && w._icon.offsetParent) {
      const k = iconDelta(w, w._icon), base = w.style.transform === 'none' ? '' : 'translate(-50%,-50%) ';
      w.animate([{ transform: (base || 'none'), opacity: 1 }, { transform: base + 'translate(' + k.dx + 'px,' + k.dy + 'px) scale(' + k.s + ')', opacity: 0, borderRadius: '14px' }],
        { duration: 400, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' });
      const ic = w._icon; setTimeout(() => { ic.classList.remove('land'); void ic.offsetWidth; ic.classList.add('land'); }, 330);
    }
    w.classList.add('closing');
    w._ct = setTimeout(() => { w.getAnimations().forEach(a => a.cancel()); w.classList.remove('fromicon'); w.classList.remove('open', 'closing'); w.hidden = true; if (!document.querySelector('.win.open:not(.closing)')) document.body.classList.remove('win-on'); w.style.left = ''; w.style.top = ''; w.style.transform = ''; }, 420);
  }
  document.querySelectorAll('[data-win]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); const id = 'win-' + b.dataset.win; switchTo(() => document.getElementById(id).classList.contains('open'), () => openWin(b.dataset.win)); }));
  document.querySelectorAll('.win').forEach(w => {
    w.querySelector('.x').addEventListener('click', () => closeWin(w));
    w.addEventListener('pointerdown', () => { w.style.zIndex = ++z; });
    const bar = w.querySelector('.bar');
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const r = w.getBoundingClientRect(); const ox = e.clientX - r.left, oy = e.clientY - r.top;
      w.style.transform = 'none'; w.style.left = r.left + 'px'; w.style.top = r.top + 'px';
      bar.setPointerCapture(e.pointerId);
      const mv = ev => { w.style.left = (ev.clientX - ox) + 'px'; w.style.top = (ev.clientY - oy) + 'px'; };
      const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up);
    });
  });
  document.querySelectorAll('a,button').forEach(el => {
    el.addEventListener('pointerenter', () => cur.classList.add('big'));
    el.addEventListener('pointerleave', () => cur.classList.remove('big'));
  });

  document.getElementById('adv').addEventListener('click', () => show(idx + 2));
  document.getElementById('prv').addEventListener('click', () => show(idx));

  // ---- worlds ----
  const ww = document.getElementById('win-world'), wstage = document.getElementById('wstage'), wthumbs = document.getElementById('wthumbs');
  let wi = 0, witems = [];
  function wshow(i) {
    wi = (i + witems.length) % witems.length;
    [...wstage.children].forEach((el, k) => { el.classList.toggle('on', k === wi); if (el.tagName === 'VIDEO') { if (k === wi) { el.currentTime = 0; el.play().catch(() => {}); } else el.pause(); } });
    [...wthumbs.children].forEach((b, k) => b.classList.toggle('on', k === wi));
    document.getElementById('wcap').textContent = witems[wi].cap || '';
  }
  function openWorld(key) {
    const w = (window.WORK || {})[key]; if (!w) return;
    ww.dataset.key = key;
    ww.querySelectorAll('video').forEach(v => v.pause());
    witems = w.items;
    document.getElementById('wno').textContent = w.no + ' · ' + w.title;
    document.getElementById('wtitle').textContent = w.title;
    document.getElementById('wline').textContent = w.line;
    const l = document.getElementById('wlink'); l.href = w.link.href; l.textContent = w.link.label;
    wstage.innerHTML = ''; wthumbs.innerHTML = '';
    w.items.forEach((it, k) => {
      let el;
      if (it.video) { el = document.createElement('video'); el.muted = true; el.loop = true; el.playsInline = true; el.setAttribute('playsinline', ''); el.preload = k === 0 ? 'auto' : 'none'; if (it.poster) el.poster = it.poster; el.src = it.video; }
      else { el = new Image(); el.src = it.src; el.alt = it.cap || ''; }
      if (it.fit === 'contain') el.classList.add('contain');
      wstage.appendChild(el);
      const b = document.createElement('button'); b.textContent = String(k + 1).padStart(2, '0');
      b.addEventListener('pointerenter', () => wshow(k)); b.addEventListener('click', () => wshow(k));
      wthumbs.appendChild(b);
    });
    wshow(0); openWin('world');
  }
  // drag or move across the image to scrub; click to step
  wstage.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.buttons !== 1) return; const r = wstage.getBoundingClientRect(); const k = Math.floor((e.clientX - r.left) / r.width * witems.length); if (k !== wi && k >= 0 && k < witems.length) wshow(k); });
  wstage.addEventListener('click', () => wshow(wi + 1));
  addEventListener('keydown', e => { if (!ww.classList.contains('open')) return; if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); wshow(wi + 1); } if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); wshow(wi - 1); } }, true);
  function switchTo(isSame, open) {
    const openNow = [...document.querySelectorAll('.win.open:not(.closing)')];
    if (openNow.length && isSame()) return;
    if (!openNow.length) { open(); return; }
    openNow.forEach(closeWin);
    setTimeout(open, 460);
  }
  document.querySelectorAll('[data-world]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); const k = a.dataset.world;
    switchTo(() => ww.classList.contains('open') && ww.dataset.key === k, () => openWorld(k));
  }));

  // open: the name fades in, holds, then the first film begins
  setTimeout(() => { if (idx < 0) show(1); }, 3400);

  document.body.classList.add('intro-on');

  // start: the About window opens once the light is up
  count.textContent = '00 / ' + pad(frames.length);
})();
