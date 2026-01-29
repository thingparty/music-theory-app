// audio-engine.js — Web Audio API synthesis

const AudioEngine = (() => {
  let audioCtx = null;

  function ensureContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Resume on user interaction (mobile Safari)
  document.addEventListener('touchstart', ensureContext, { once: true });
  document.addEventListener('click', ensureContext, { once: true });

  /**
   * Play a single note with ADSR envelope
   * @param {string} note - Chromatic note name (e.g. 'C#')
   * @param {number} octave - Octave number (e.g. 4)
   * @param {number} duration - Duration in seconds (default 0.8)
   */
  function playNote(note, octave, duration = 0.8) {
    const ctx = ensureContext();
    const freq = getFrequency(note, octave);
    const now = ctx.currentTime;

    // Oscillator — triangle for warm tone
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    // Gain for ADSR envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);

    // ADSR
    const attack = 0.02;
    const decay = 0.1;
    const sustainLevel = 0.3;
    const release = 0.3;

    gain.gain.linearRampToValueAtTime(0.5, now + attack);
    gain.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
    gain.gain.setValueAtTime(sustainLevel, now + duration - release);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /**
   * Play a chord with staggered notes for arpeggiated feel
   * @param {Array<{note: string}>} notes - Array of note objects with .note property
   * @param {number} octave - Base octave
   */
  function playChord(notes, octave) {
    notes.forEach((n, i) => {
      setTimeout(() => {
        playNote(n.note, octave, 1.2);
      }, i * 50);
    });
  }

  return { playNote, playChord, ensureContext };
})();
