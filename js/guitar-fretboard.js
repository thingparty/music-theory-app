// guitar-fretboard.js — Guitar fretboard rendering and highlighting

const GuitarFretboard = (() => {
  let activeNotes = new Set();
  let rootNote = null;
  let onNotePlay = null;
  let currentKey = 'C';

  // Standard tuning: string 6 (low E) to string 1 (high E)
  // Each entry: { note (chromatic), octave }
  const TUNING = [
    { note: 'E', octave: 2, label: 'E' },   // 6th string (low)
    { note: 'A', octave: 2, label: 'A' },   // 5th
    { note: 'D', octave: 3, label: 'D' },   // 4th
    { note: 'G', octave: 3, label: 'G' },   // 3rd
    { note: 'B', octave: 3, label: 'B' },   // 2nd
    { note: 'E', octave: 4, label: 'E' },   // 1st string (high)
  ];

  const NUM_FRETS = 15;
  const FRET_MARKERS = [3, 5, 7, 9, 12, 15];
  const DOUBLE_MARKERS = [12];

  function init(containerId, callback) {
    onNotePlay = callback;
    render(containerId);
  }

  function getNoteAtFret(stringIndex, fret) {
    const openNote = TUNING[stringIndex];
    const openIndex = getNoteIndex(openNote.note);
    const noteIndex = (openIndex + fret) % 12;
    const octave = openNote.octave + Math.floor((openIndex + fret) / 12);
    return {
      note: CHROMATIC_NOTES[noteIndex],
      octave: octave,
    };
  }

  function render(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const fretboard = document.createElement('div');
    fretboard.className = 'fretboard';

    // Fret numbers row
    const fretNumbers = document.createElement('div');
    fretNumbers.className = 'fret-numbers';
    const openLabel = document.createElement('div');
    openLabel.className = 'fret-number string-label-spacer';
    fretNumbers.appendChild(openLabel);
    for (let f = 0; f <= NUM_FRETS; f++) {
      const num = document.createElement('div');
      num.className = 'fret-number';
      num.textContent = f === 0 ? '' : f;
      fretNumbers.appendChild(num);
    }
    fretboard.appendChild(fretNumbers);

    // Strings (top = high E, bottom = low E for standard neck-facing-up view)
    for (let s = TUNING.length - 1; s >= 0; s--) {
      const stringRow = document.createElement('div');
      stringRow.className = 'guitar-string-row';

      // String label
      const label = document.createElement('div');
      label.className = 'string-label';
      label.textContent = TUNING[s].label;
      stringRow.appendChild(label);

      // Open string + frets
      for (let f = 0; f <= NUM_FRETS; f++) {
        const { note, octave } = getNoteAtFret(s, f);
        const fretCell = document.createElement('div');
        fretCell.className = 'fret-cell';
        if (f === 0) fretCell.classList.add('open-string');

        const dot = document.createElement('div');
        dot.className = 'fret-dot';

        const isActive = activeNotes.has(note);
        const isRoot = note === rootNote;

        if (isActive) {
          dot.classList.add('active');
          const displayName = getDisplayNote(note, currentKey);
          dot.textContent = displayName;
        }
        if (isRoot) {
          dot.classList.add('root');
        }

        dot.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (onNotePlay) onNotePlay(note, octave);
          dot.classList.add('pressed');
          setTimeout(() => dot.classList.remove('pressed'), 300);
        });
        dot.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (onNotePlay) onNotePlay(note, octave);
          dot.classList.add('pressed');
          setTimeout(() => dot.classList.remove('pressed'), 300);
        });

        fretCell.appendChild(dot);
        stringRow.appendChild(fretCell);
      }

      fretboard.appendChild(stringRow);
    }

    // Fret markers row
    const markers = document.createElement('div');
    markers.className = 'fret-markers';
    const markerSpacer = document.createElement('div');
    markerSpacer.className = 'fret-marker string-label-spacer';
    markers.appendChild(markerSpacer);
    for (let f = 0; f <= NUM_FRETS; f++) {
      const m = document.createElement('div');
      m.className = 'fret-marker';
      if (FRET_MARKERS.includes(f)) {
        const pip = document.createElement('span');
        pip.className = 'marker-pip';
        m.appendChild(pip);
        if (DOUBLE_MARKERS.includes(f)) {
          const pip2 = document.createElement('span');
          pip2.className = 'marker-pip';
          m.appendChild(pip2);
        }
      }
      markers.appendChild(m);
    }
    fretboard.appendChild(markers);

    container.appendChild(fretboard);
  }

  function setActiveNotes(notes, root, key) {
    activeNotes = new Set(notes);
    rootNote = root;
    currentKey = key || 'C';
  }

  function refresh(containerId) {
    render(containerId);
  }

  return { init, setActiveNotes, refresh };
})();
