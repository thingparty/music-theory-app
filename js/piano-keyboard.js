// piano-keyboard.js — Piano keyboard rendering and highlighting

const PianoKeyboard = (() => {
  let activeNotes = new Set(); // chromatic note names in the scale
  let rootNote = null;
  let onNotePlay = null;

  // 2 octaves: C3 to B4
  const START_OCTAVE = 3;
  const NUM_OCTAVES = 2;

  const WHITE_NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  // Position index: which white key gap the black key sits after
  // C#: between C(0) and D(1), D#: between D(1) and E(2),
  // F#: between F(3) and G(4), G#: between G(4) and A(5), A#: between A(5) and B(6)
  const BLACK_NOTE_POSITIONS = {
    'C#': 0, 'D#': 1, 'F#': 3, 'G#': 4, 'A#': 5
  };

  function init(containerId, callback) {
    onNotePlay = callback;
    render(containerId);
  }

  function render(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const keyboard = document.createElement('div');
    keyboard.className = 'piano-keyboard';

    for (let oct = START_OCTAVE; oct < START_OCTAVE + NUM_OCTAVES; oct++) {
      const octaveDiv = document.createElement('div');
      octaveDiv.className = 'piano-octave';

      // White keys
      WHITE_NOTE_NAMES.forEach(note => {
        const key = document.createElement('div');
        key.className = 'piano-key white';
        key.setAttribute('data-note', note);
        key.setAttribute('data-octave', oct);

        if (activeNotes.has(note)) {
          key.classList.add('active');
        }
        if (note === rootNote) {
          key.classList.add('root');
        }

        const label = document.createElement('span');
        label.className = 'key-label';
        label.textContent = note;
        key.appendChild(label);

        key.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (onNotePlay) onNotePlay(note, oct);
          key.classList.add('pressed');
        });
        key.addEventListener('mouseup', () => key.classList.remove('pressed'));
        key.addEventListener('mouseleave', () => key.classList.remove('pressed'));
        key.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (onNotePlay) onNotePlay(note, oct);
          key.classList.add('pressed');
        });
        key.addEventListener('touchend', () => key.classList.remove('pressed'));

        octaveDiv.appendChild(key);
      });

      // Black keys — positioned at the border between white keys
      const whiteKeyWidth = 52; // matches CSS
      Object.entries(BLACK_NOTE_POSITIONS).forEach(([note, position]) => {
        const key = document.createElement('div');
        key.className = 'piano-key black';
        key.setAttribute('data-note', note);
        key.setAttribute('data-octave', oct);
        // Center the black key on the border between white keys
        const blackKeyWidth = 32;
        key.style.width = blackKeyWidth + 'px';
        key.style.left = ((position + 1) * whiteKeyWidth - blackKeyWidth / 2) + 'px';

        if (activeNotes.has(note)) {
          key.classList.add('active');
        }
        if (note === rootNote) {
          key.classList.add('root');
        }

        key.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (onNotePlay) onNotePlay(note, oct);
          key.classList.add('pressed');
        });
        key.addEventListener('mouseup', () => key.classList.remove('pressed'));
        key.addEventListener('mouseleave', () => key.classList.remove('pressed'));
        key.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (onNotePlay) onNotePlay(note, oct);
          key.classList.add('pressed');
        });
        key.addEventListener('touchend', () => key.classList.remove('pressed'));

        octaveDiv.appendChild(key);
      });

      keyboard.appendChild(octaveDiv);
    }

    container.appendChild(keyboard);
  }

  function setActiveNotes(notes, root) {
    activeNotes = new Set(notes);
    rootNote = root;
  }

  function refresh(containerId) {
    render(containerId);
  }

  return { init, setActiveNotes, refresh };
})();
