// Score: a restrained, generated cue. Low strings, a walking bass, brushed kit, a distant muted trumpet.
// D Phrygian dominant at 82 bpm. Think a spy film scored by a jazz ensemble in Marrakech.
(() => {
  const btn = document.getElementById('snd');
  if (!btn) return;
  let ac, master, rev, on = false, built = false, timer, nextT = 0, step = 0;
  const BPM = 82, SPB = 60 / BPM, S8 = SPB / 2;
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  // D Phrygian dominant: D Eb F# G A Bb C
  const scale = [62, 63, 66, 67, 69, 70, 72];

  function noiseBuf(sec) { const b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
  function reverb() {
    const len = ac.sampleRate * 3.2, b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const cv = ac.createConvolver(); cv.buffer = b; return cv;
  }
  let nb;
  function build() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ac.destination);
    rev = reverb(); const rg = ac.createGain(); rg.gain.value = 0.32; rev.connect(rg); rg.connect(master);
    nb = noiseBuf(1);
    built = true;
  }
  const out = (node, wet = 0.3) => { node.connect(master); const s = ac.createGain(); s.gain.value = wet; node.connect(s); s.connect(rev); };

  // low strings: slow swelling chord, detuned saws through a warm filter
  function strings(t, notes, dur) {
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1100, t + dur * .5); f.frequency.linearRampToValueAtTime(600, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.055, t + dur * .4); g.gain.linearRampToValueAtTime(0, t + dur);
    f.connect(g); out(g, 0.55);
    notes.forEach(n => [-6, 6].forEach(dt => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + .1); }));
  }
  // upright bass: soft plucked sine with a little body
  function bass(t, n) {
    const o = ac.createOscillator(), o2 = ac.createOscillator(); o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = hz(n); o2.frequency.value = hz(n);
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + .012); g.gain.exponentialRampToValueAtTime(0.03, t + SPB * .9); g.gain.linearRampToValueAtTime(0, t + SPB);
    const g2 = ac.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(g); o.connect(g); out(g, 0.08);
    o.start(t); o2.start(t); o.stop(t + SPB + .05); o2.stop(t + SPB + .05);
  }
  // brushes: swish on 2 and 4, soft ride taps on the swing eighths
  function brush(t, amt, len, freq) {
    const s = ac.createBufferSource(); s.buffer = nb;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amt, t + len * .25); g.gain.exponentialRampToValueAtTime(0.0008, t + len);
    s.connect(f); f.connect(g); out(g, 0.25); s.start(t, Math.random() * .5); s.stop(t + len + .02);
  }
  // distant muted trumpet: bright saw through a nasal band, slow vibrato, lots of room
  function trumpet(t, n, dur) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(n);
    const vib = ac.createOscillator(); vib.frequency.value = 5.2; const vg = ac.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(5, t + dur * .6); vib.connect(vg); vg.connect(o.detune);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2.2;
    const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 2600;
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + .09); g.gain.setValueAtTime(0.04, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f); f.connect(f2); f2.connect(g); out(g, 0.9);
    o.start(t); vib.start(t); o.stop(t + dur + .05); vib.stop(t + dur + .05);
  }

  // 8-bar form. Chords (MIDI): Dm-ish over the Phrygian-dominant colour.
  const chords = [[50, 57, 62, 66], [51, 58, 63, 67], [50, 57, 62, 66], [48, 55, 60, 63], [50, 57, 62, 66], [51, 58, 63, 67], [55, 58, 62, 67], [57, 61, 64, 69]];
  const bassLine = [[38, 45, 42, 45], [39, 46, 43, 46], [38, 45, 50, 45], [36, 43, 39, 43], [38, 42, 45, 50], [39, 43, 46, 51], [43, 46, 50, 46], [45, 49, 52, 45]];
  // sparse trumpet phrases: [bar, beat, scale-degree offset, beats]
  const horn = [[1, 2, 4, 1.5], [1, 3.5, 3, .5], [1, 4, 1, 2.5], [5, 1, 6, 1], [5, 2, 4, 1], [5, 3, 3, 1], [5, 4, 1, 3]];
  let bar = 0, cycle = 0;

  function schedule() {
    while (nextT < ac.currentTime + 0.25) {
      const beat = step % 4, b = bar % 8;
      const t = nextT;
      if (beat === 0) strings(t, chords[b], SPB * 4.1);
      if (cycle > 0 || bar >= 2) bass(t, bassLine[b][beat]);
      if (cycle > 0 || bar >= 4) {
        if (beat === 1 || beat === 3) brush(t, 0.05, .28, 2500);
        brush(t, 0.022, .12, 7000); brush(t + SPB * 0.66, 0.014, .08, 8000);
      }
      if (cycle > 0 || bar >= 8) horn.forEach(([hb, hbt, deg, len]) => {
        if (hb === b + 1 && Math.floor(hbt - 1) === beat) trumpet(t + (hbt - 1 - beat) * SPB, scale[deg % 7] + (deg >= 7 ? 12 : 0), len * SPB);
      });
      nextT += SPB; step++;
      if (step % 4 === 0) { bar++; if (bar % 8 === 0) cycle++; }
    }
  }

  window.tkTone = () => {}; // the score replaces the per-film tone

  function set(v) {
    on = v; btn.textContent = on ? 'Sound on' : 'Sound off'; btn.setAttribute('aria-pressed', on);
    if (!ac) return;
    const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(on ? 0.9 : 0, t + (on ? 3 : 1));
    if (on && !timer) { nextT = ac.currentTime + 0.1; timer = setInterval(schedule, 60); }
    if (!on) setTimeout(() => { if (!on) { clearInterval(timer); timer = null; } }, 1100);
  }
  btn.addEventListener('click', () => {
    try { if (!built) build(); if (ac.state === 'suspended') ac.resume(); set(!on); }
    catch (e) { btn.textContent = 'Sound unavailable'; }
  });
})();
