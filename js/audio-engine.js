// audio-engine.js — Web Audio API synthesis

const AudioEngine = (() => {
  let audioCtx = null;
  let speakerUnlocked = false;

  // iOS routes Web Audio API to the earpiece by default.
  // Playing a silent WAV through an <audio> element forces the main speaker.
  function unlockIOSSpeaker() {
    if (speakerUnlocked) return;
    speakerUnlocked = true;

    // Build a minimal valid WAV file (1 sample of silence, 16-bit mono 44100Hz)
    const sampleRate = 44100;
    const numSamples = sampleRate; // 1 second of silence
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);          // chunk size
    view.setUint16(20, 1, true);           // PCM format
    view.setUint16(22, 1, true);           // mono
    view.setUint32(24, sampleRate, true);   // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true);           // block align
    view.setUint16(34, 16, true);          // bits per sample
    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);
    // samples are already 0 (silence)

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().then(() => {
      // Pause after a brief moment — we just need it to start
      setTimeout(() => { audio.pause(); URL.revokeObjectURL(url); }, 250);
    }).catch(() => {
      URL.revokeObjectURL(url);
    });
  }

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  function ensureContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    unlockIOSSpeaker();
    return audioCtx;
  }

  // Resume on user interaction (mobile Safari / Chrome iOS)
  document.addEventListener('touchstart', ensureContext, { once: true });
  document.addEventListener('touchend', ensureContext, { once: true });
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
