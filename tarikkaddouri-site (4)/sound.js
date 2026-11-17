// Soundscape: generated live, no audio files. A dark room at night by the sea:
// a low warm drone, slow breathing surf, faint air, and one soft tone each time a film changes.
(() => {
  const btn = document.getElementById('snd');
  if (!btn) return;
  let ctx, master, on = false, built = false;

  function noise(c, seconds) {
    const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // brown noise
    const s = c.createBufferSource(); s.buffer = b; s.loop = true; return s;
  }

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);

    // drone: two detuned low sines and a fifth, through a slow-moving lowpass
    const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 420; dl.Q.value = 0.7;
    const dg = ctx.createGain(); dg.gain.value = 0.16; dl.connect(dg); dg.connect(master);
    [[55, 0], [55.4, 0], [82.4, 0.5]].forEach(([f, pan]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = pan ? 0.35 : 0.5;
      o.connect(g); g.connect(dl); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.03; const lg = ctx.createGain(); lg.gain.value = 180;
    lfo.connect(lg); lg.connect(dl.frequency); lfo.start();

    // surf: brown noise through a band that swells every ~9 seconds
    const sea = noise(ctx, 6); const sf = ctx.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 700;
    const sg = ctx.createGain(); sg.gain.value = 0.05;
    const swell = ctx.createOscillator(); swell.frequency.value = 0.11; const swg = ctx.createGain(); swg.gain.value = 0.045;
    swell.connect(swg); swg.connect(sg.gain); swell.start();
    sea.connect(sf); sf.connect(sg); sg.connect(master); sea.start();

    // air: a whisper of high noise, panned wide
    const air = noise(ctx, 4); const af = ctx.createBiquadFilter(); af.type = 'highpass'; af.frequency.value = 3000;
    const ag = ctx.createGain(); ag.gain.value = 0.012; air.connect(af); af.connect(ag); ag.connect(master); air.start(0.5);
    built = true;
  }

  // one soft tone when a new film develops
  const notes = [220, 261.6, 293.7, 329.6, 392, 440];
  window.tkTone = (i) => {
    if (!on || !ctx) return;
    const t = ctx.currentTime, f = notes[(i || 0) % notes.length];
    [f, f * 2.005].forEach((fr, k) => {
      const o = ctx.createOscillator(); o.type = k ? 'sine' : 'triangle'; o.frequency.value = fr;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(k ? 0.015 : 0.035, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 5.2);
    });
  };

  function set(v) {
    on = v;
    btn.textContent = on ? 'Sound on' : 'Sound off';
    btn.setAttribute('aria-pressed', on);
    if (!ctx) return;
    const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(on ? 0.9 : 0, t + (on ? 2.5 : 0.8));
  }
  btn.addEventListener('click', () => {
    try { if (!built) build(); if (ctx.state === 'suspended') ctx.resume(); set(!on); }
    catch (e) { btn.textContent = 'Sound unavailable'; }
  });
  try { localStorage.getItem('tk-sound') === '1' && btn.classList.add('hint'); } catch (e) {}
})();
