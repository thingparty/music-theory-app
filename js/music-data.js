// music-data.js — Pure data and music theory functions

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// For display purposes in flat keys
const ENHARMONIC_MAP = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
};

// Keys that prefer flat notation for display
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];

// Circle of fifths order (clockwise from top)
const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

// Display names for circle of fifths keys
const KEY_DISPLAY_NAMES = {
  'C': 'C', 'G': 'G', 'D': 'D', 'A': 'A', 'E': 'E', 'B': 'B',
  'F#': 'F#/Gb', 'Db': 'Db', 'Ab': 'Ab', 'Eb': 'Eb', 'Bb': 'Bb', 'F': 'F'
};

// Internal key (sharp-based) for circle keys
const KEY_TO_CHROMATIC = {
  'C': 'C', 'G': 'G', 'D': 'D', 'A': 'A', 'E': 'E', 'B': 'B',
  'F#': 'F#', 'Db': 'C#', 'Ab': 'G#', 'Eb': 'D#', 'Bb': 'A#', 'F': 'F'
};

// Mode definitions: name and semitone intervals from root
const MODES = {
  ionian:     { name: 'Ionian (Major)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian:     { name: 'Dorian',         intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian:   { name: 'Phrygian',       intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian:     { name: 'Lydian',          intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { name: 'Mixolydian',      intervals: [0, 2, 4, 5, 7, 9, 10] },
  aeolian:    { name: 'Aeolian (Minor)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  locrian:    { name: 'Locrian',         intervals: [0, 1, 3, 5, 6, 8, 10] },
};

// Chord qualities for each scale degree per mode
// maj = major triad, min = minor triad, dim = diminished triad, aug = augmented
const MODE_CHORD_QUALITIES = {
  ionian:     ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
  dorian:     ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj'],
  phrygian:   ['min', 'maj', 'maj', 'min', 'dim', 'maj', 'min'],
  lydian:     ['maj', 'maj', 'min', 'dim', 'maj', 'min', 'min'],
  mixolydian: ['maj', 'min', 'dim', 'maj', 'min', 'min', 'maj'],
  aeolian:    ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
  locrian:    ['dim', 'maj', 'min', 'min', 'maj', 'maj', 'min'],
};

// Roman numeral labels
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Chord intervals from root (in semitones)
const CHORD_INTERVALS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

/**
 * Get the chromatic index of a note name (sharp-based)
 */
function getNoteIndex(note) {
  let idx = CHROMATIC_NOTES.indexOf(note);
  if (idx === -1) {
    // Try enharmonic lookup
    for (const [sharp, flat] of Object.entries(ENHARMONIC_MAP)) {
      if (flat === note) {
        idx = CHROMATIC_NOTES.indexOf(sharp);
        break;
      }
    }
  }
  return idx;
}

/**
 * Get display name for a note given the current key context
 */
function getDisplayNote(chromaticNote, key) {
  const useFlats = FLAT_KEYS.includes(key);
  if (useFlats && ENHARMONIC_MAP[chromaticNote]) {
    return ENHARMONIC_MAP[chromaticNote];
  }
  return chromaticNote;
}

/**
 * Get scale notes for a given key and mode
 * Returns array of { note (chromatic), display (contextual name) }
 */
function getScaleNotes(key, mode) {
  const rootIndex = getNoteIndex(KEY_TO_CHROMATIC[key] || key);
  const intervals = MODES[mode].intervals;

  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const chromaticNote = CHROMATIC_NOTES[noteIndex];
    return {
      note: chromaticNote,
      display: getDisplayNote(chromaticNote, key),
    };
  });
}

/**
 * Get diatonic chords for a given key and mode
 * Returns array of { root, quality, romanNumeral, notes[] }
 */
function getDiatonicChords(key, mode) {
  const scaleNotes = getScaleNotes(key, mode);
  const qualities = MODE_CHORD_QUALITIES[mode];

  return scaleNotes.map((scaleNote, i) => {
    const quality = qualities[i];
    const rootIndex = getNoteIndex(scaleNote.note);
    const chordIntervals = CHORD_INTERVALS[quality];

    const chordNotes = chordIntervals.map(interval => {
      const idx = (rootIndex + interval) % 12;
      return {
        note: CHROMATIC_NOTES[idx],
        display: getDisplayNote(CHROMATIC_NOTES[idx], key),
      };
    });

    // Format roman numeral: uppercase for major, lowercase for minor/dim
    let numeral = ROMAN_NUMERALS[i];
    if (quality === 'min' || quality === 'dim') {
      numeral = numeral.toLowerCase();
    }
    if (quality === 'dim') numeral += '\u00B0'; // degree symbol
    if (quality === 'aug') numeral += '+';

    return {
      root: scaleNote,
      quality,
      romanNumeral: numeral,
      displayName: scaleNote.display + (quality === 'min' ? 'm' : quality === 'dim' ? 'dim' : quality === 'aug' ? 'aug' : ''),
      notes: chordNotes,
    };
  });
}

/**
 * Get frequency in Hz for a given note and octave (A4 = 440)
 */
function getFrequency(note, octave) {
  const noteIndex = getNoteIndex(note);
  // A4 = 440Hz, A is index 9, octave 4
  const semitonesFromA4 = (noteIndex - 9) + (octave - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}
