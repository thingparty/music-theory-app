// app.js — Main controller

const App = (() => {
  let state = {
    selectedKey: null,
    selectedMode: 'ionian',
    scaleNotes: [],
    chords: [],
  };

  function init() {
    CircleOfFifths.init('circle-container', onKeySelected);
    PianoKeyboard.init('keyboard-container', onPianoKeyPlayed);
    setupModeButtons();
    // Select C by default
    onKeySelected('C');
    CircleOfFifths.setSelected('C');
  }

  function onKeySelected(key) {
    state.selectedKey = key;
    update();
  }

  function onModeSelected(mode) {
    state.selectedMode = mode;
    update();
  }

  function onPianoKeyPlayed(note, octave) {
    AudioEngine.playNote(note, octave);
  }

  function update() {
    if (!state.selectedKey) return;

    state.scaleNotes = getScaleNotes(state.selectedKey, state.selectedMode);
    state.chords = getDiatonicChords(state.selectedKey, state.selectedMode);

    updateHeader();
    updateScaleDisplay();
    updateChordsDisplay();
    updatePiano();
    updateModeButtons();
  }

  function updateHeader() {
    const keyDisplay = KEY_DISPLAY_NAMES[state.selectedKey] || state.selectedKey;
    const modeName = MODES[state.selectedMode].name;
    document.getElementById('current-key-mode').textContent = `${keyDisplay} ${modeName}`;
  }

  function setupModeButtons() {
    const container = document.getElementById('mode-buttons');
    container.innerHTML = '';

    Object.entries(MODES).forEach(([modeKey, modeData]) => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.setAttribute('data-mode', modeKey);
      btn.textContent = modeData.name;
      btn.addEventListener('click', () => onModeSelected(modeKey));
      container.appendChild(btn);
    });
  }

  function updateModeButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === state.selectedMode);
    });
  }

  function updateScaleDisplay() {
    const container = document.getElementById('scale-notes');
    container.innerHTML = '';

    state.scaleNotes.forEach((n, i) => {
      const span = document.createElement('span');
      span.className = 'scale-note';
      if (i === 0) span.classList.add('root');
      span.textContent = n.display;
      span.addEventListener('click', () => {
        AudioEngine.playNote(n.note, 4);
      });
      container.appendChild(span);
    });
  }

  function updateChordsDisplay() {
    const container = document.getElementById('chord-cards');
    container.innerHTML = '';

    state.chords.forEach(chord => {
      const card = document.createElement('div');
      card.className = 'chord-card';
      card.innerHTML = `
        <div class="chord-numeral">${chord.romanNumeral}</div>
        <div class="chord-name">${chord.displayName}</div>
        <div class="chord-notes">${chord.notes.map(n => n.display).join(' ')}</div>
      `;
      card.addEventListener('click', () => {
        AudioEngine.playChord(chord.notes, 4);
        card.classList.add('played');
        setTimeout(() => card.classList.remove('played'), 400);
      });
      container.appendChild(card);
    });
  }

  function updatePiano() {
    const chromaticNotes = state.scaleNotes.map(n => n.note);
    const root = state.scaleNotes.length > 0 ? state.scaleNotes[0].note : null;
    PianoKeyboard.setActiveNotes(chromaticNotes, root);
    PianoKeyboard.refresh('keyboard-container');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
