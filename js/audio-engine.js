// audio-engine.js — Web Audio API synthesis

const AudioEngine = (() => {
  let audioCtx = null;
  let speakerUnlocked = false;

  // iOS Safari routes Web Audio to the earpiece by default.
  // Playing a silent HTML <audio> element on first interaction forces
  // output to the main loudspeaker.
  function unlockIOSSpeaker() {
    if (speakerUnlocked) return;
    speakerUnlocked = true;
    const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwMHAAAAAAD/+1DEAAAHAAGf9AAAIiWcM/8woABMIQBhn/6YeGH4fg+D9YPg/WD4f1g+D9Z/8H6wf/9YPg/8HwfB8EAQBA7+sHwfB8HwQBAEAQO/4Pg/B8HwQBAEDv/rB8HwfB8EAQBA7/6wfB+D4Pg+CAQO///wfB+D4Pg+CAIAgd//WD4Pw+D4PggEDv//8Hwfg+D4IAg7///4Pg/B8HwfBAIHf///rB8H4fB8EAQO////+D4Pw+D4PggCAIHf///1g+D8Hw+CAYBA////+sHwfg+D4Pg+CAIO////6wfB+D4Pg+D4Ig7///+sHwfh+HwfBAEDv////WD4Pw+D4Pg+CAQO////6wfB+H4fB8EAQBA7///+sHwfh8HwfBAEAQO////+D4Pw+D4IAg7///+sH//tQxBMAAADSAAAAAAAAANIAAAAAwfB+D4PggCB3///9YPg/D8PggCAIHf///6wfB+D4PggCB3///9YPg/D4Pg+CAIO////rB8H4fB8HwQBB3///9YPg/B8HwfBAEHf///1g+D8HwfB8EAQO///+sHwfh8HwfBAEDv///6wfB+H4fB8EAQBA7///+sHwfh+HwfBAEAQO////+D4Pw/D4PggCDv///6wfB+H4fB8EAQO////rB8H4fh8HwQBB3///+sHwfB+HwfBAEHf///6wfB+D4Pg+CAIO////WD4PwfB8HwQBB3///+sHwfB8HwfBAEHf///1g+D8PwfB8EAQO///+D4Pw+D4PggCDv//+sHwfB+H4fBAEDv//+D4Pw/D4Pg+CAQO///rB8H4fB8EAQO///WD4Pw+D4Pg+CAIHf//1g+D8Pw+D4Ig');
    silentAudio.play().catch(() => {});
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
