// audio-engine.js — Web Audio API synthesis

const AudioEngine = (() => {
  let audioCtx = null;
  let masterGain = null;
  let silentAudio = null;

  // On iOS, pure Web Audio oscillators route to the earpiece speaker.
  // To force the loudspeaker, we connect a silent <audio> element as a
  // MediaElementSource into the same AudioContext. This switches the
  // entire audio session to "media playback" mode (loudspeaker).
  function createSilentMediaElement() {
    // Build a looping silent WAV
    const sampleRate = 8000;
    const numSamples = sampleRate; // 1 second
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.loop = true;
    // Connect it into the AudioContext graph so iOS treats the whole
    // context as media playback
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(audioCtx.destination);
    audio.play().catch(() => {});
    return audio;
  }

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  function ensureContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
      silentAudio = createSilentMediaElement();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (silentAudio && silentAudio.paused) {
      silentAudio.play().catch(() => {});
    }
    return audioCtx;
  }

  // Unlock on first user interaction (required by mobile browsers)
  function onFirstInteraction() {
    ensureContext();
  }
  document.addEventListener('touchstart', onFirstInteraction, { once: true });
  document.addEventListener('touchend', onFirstInteraction, { once: true });
  document.addEventListener('click', onFirstInteraction, { once: true });

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
    gain.connect(masterGain);

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
