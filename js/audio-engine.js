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
   * Play a piano-like note with hammer attack and resonance
   * @param {string} note - Chromatic note name (e.g. 'C#')
   * @param {number} octave - Octave number (e.g. 4)
   * @param {number} duration - Duration in seconds (default 0.8)
   */
  function playPianoNote(note, octave, duration = 0.8) {
    const ctx = ensureContext();
    const freq = getFrequency(note, octave);
    const now = ctx.currentTime;

    // Piano uses a few harmonics for warmth without muddiness
    const harmonics = [
      { ratio: 1, gain: 1.0 },      // fundamental
      { ratio: 2, gain: 0.3 },      // octave
      { ratio: 3, gain: 0.1 },      // fifth above octave
    ];

    // Single gain node for all oscillators to keep them synchronized
    const masterNoteGain = ctx.createGain();
    masterNoteGain.gain.setValueAtTime(0, now);
    masterNoteGain.connect(masterGain);

    // Piano envelope: sharp attack, quick decay to silence
    const peakGain = 0.3;
    const attack = 0.008;
    const decay = duration * 0.3;

    masterNoteGain.gain.linearRampToValueAtTime(peakGain, now + attack);
    masterNoteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    harmonics.forEach(h => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * h.ratio, now);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(h.gain, now);

      osc.connect(oscGain);
      oscGain.connect(masterNoteGain);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    });
  }

  /**
   * Play a guitar-like plucked string note
   * @param {string} note - Chromatic note name (e.g. 'C#')
   * @param {number} octave - Octave number (e.g. 4)
   * @param {number} duration - Duration in seconds (default 1.5)
   */
  function playGuitarNote(note, octave, duration = 1.5) {
    const ctx = ensureContext();
    const freq = getFrequency(note, octave);
    const now = ctx.currentTime;

    // Guitar: sawtooth through lowpass filter for plucked string sound
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    // Lowpass filter - starts bright, then darkens (simulates string damping)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 6, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration * 0.7);
    filter.Q.setValueAtTime(1, now);

    // Add a subtle second oscillator for body resonance
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);

    // Pluck envelope: instant attack, smooth exponential decay
    const peakGain = 0.25;
    const attack = 0.003;

    gain.gain.linearRampToValueAtTime(peakGain, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    gain2.gain.linearRampToValueAtTime(peakGain * 0.3, now + attack);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
    osc2.start(now);
    osc2.stop(now + duration + 0.05);
  }

  /**
   * Play a single note (legacy, uses piano sound)
   */
  function playNote(note, octave, duration = 0.8) {
    playPianoNote(note, octave, duration);
  }

  /**
   * Play a piano chord with staggered notes
   * @param {Array<{note: string}>} notes - Array of note objects with .note property
   * @param {number} octave - Base octave
   */
  function playPianoChord(notes, octave) {
    notes.forEach((n, i) => {
      setTimeout(() => {
        playPianoNote(n.note, octave, 1.0);
      }, i * 40);
    });
  }

  /**
   * Play a guitar chord with staggered notes (strummed feel)
   * @param {Array<{note: string}>} notes - Array of note objects with .note property
   * @param {number} octave - Base octave
   */
  function playGuitarChord(notes, octave) {
    notes.forEach((n, i) => {
      setTimeout(() => {
        playGuitarNote(n.note, octave, 2.0);
      }, i * 30);
    });
  }

  /**
   * Play a chord (legacy, uses piano sound)
   */
  function playChord(notes, octave) {
    playPianoChord(notes, octave);
  }

  return { playNote, playChord, playPianoNote, playPianoChord, playGuitarNote, playGuitarChord, ensureContext };
})();
