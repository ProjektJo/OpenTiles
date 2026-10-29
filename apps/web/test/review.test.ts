// Spaced review in the app (P7-27): what is due among the learner's choices, what is due outside
// them, the review drills' links, and the note on the setup pages.
import { describe, expect, it } from 'vitest';
import { parseChordDrillId, parseScaleDrillId } from '@opentiles/practice';
import type { ChordRound, ChordStats, ScaleRound, ScaleStats } from '@opentiles/practice';
import { DEFAULT_CHORD_DRILL_PREFS } from '../src/practice/chord-drill';
import { DEFAULT_SCALE_DRILL_PREFS } from '../src/practice/scale-drill';
import {
  chordReviewRoute,
  dueChords,
  dueNote,
  dueScales,
  scaleReviewRoute,
} from '../src/practice/review';

const day = (d: number) => new Date(2026, 9, d, 12).getTime();

const chordRound = (at: number, kinds: ChordRound['kinds']): ChordRound => ({
  at,
  chords: 0,
  firstTry: 0,
  perMinute: 0,
  kinds,
});
const chordStats = (...rounds: ChordRound[]): ChordStats => ({ version: 1, rounds });

const scaleRound = (at: number, kinds: ScaleRound['kinds']): ScaleRound => ({
  at,
  scales: 0,
  firstTry: 0,
  notesPerMinute: 0,
  evenness: null,
  kinds,
});
const scaleStats = (...rounds: ScaleRound[]): ScaleStats => ({ version: 1, rounds });

const idOf = (route: ReturnType<typeof chordReviewRoute>) =>
  route.name === 'practice' ? route.id : '';

describe('due for review (P7-27)', () => {
  // C major and A minor are in level 1; D♭ major is not.
  const first = chordStats(
    chordRound(day(1), { '0.maj': [4, 4, 0], '9.min': [4, 4, 0], '1.maj': [4, 4, 0] }),
  );

  it('counts the due chords the learner’s level draws, and those outside it', () => {
    expect(dueChords(first, DEFAULT_CHORD_DRILL_PREFS, day(1))).toEqual({ kinds: [], outside: 0 });
    expect(dueChords(first, DEFAULT_CHORD_DRILL_PREFS, day(2))).toEqual({
      kinds: ['0.maj', '9.min'],
      outside: 1,
    });
    // Level 3 has all twelve roots.
    expect(dueChords(first, { ...DEFAULT_CHORD_DRILL_PREFS, level: 3 }, day(2))).toEqual({
      kinds: ['0.maj', '1.maj', '9.min'],
      outside: 0,
    });
  });

  it('has nothing due once the review round is kept', () => {
    const after = chordStats(
      ...first.rounds,
      chordRound(day(2), { '0.maj': [2, 2, 0], '9.min': [3, 1, 0] }),
    );
    expect(dueChords(after, DEFAULT_CHORD_DRILL_PREFS, day(2))).toEqual({ kinds: [], outside: 1 });
    // A miss brings the chord back the next day.
    expect(dueChords(after, DEFAULT_CHORD_DRILL_PREFS, day(3)).kinds).toEqual(['9.min']);
  });

  it('counts the due scales the same way', () => {
    const stats = scaleStats(scaleRound(day(1), { '0.major': [2, 2], '2.major': [2, 2] }));
    expect(dueScales(stats, DEFAULT_SCALE_DRILL_PREFS, day(2))).toEqual({
      kinds: ['0.major'],
      outside: 1,
    });
  });

  it('opens a review drill: the learner’s choices, each due kind once', () => {
    const prefs = { ...DEFAULT_CHORD_DRILL_PREFS, level: 3 as const, count: 8 };
    const two = parseChordDrillId(idOf(chordReviewRoute(prefs, ['0.maj', '9.min'], 7)));
    expect(two).toMatchObject({ level: 3, count: 2, focus: ['0.maj', '9.min'], only: true });
    const twenty = Array.from({ length: 20 }, (_, i) => `${i % 12}.${i < 12 ? 'maj' : 'min'}`);
    const many = parseChordDrillId(idOf(chordReviewRoute(prefs, twenty, 7)));
    expect(many.count).toBe(20);
    expect(many.focus).toEqual(twenty);

    const scales = Array.from({ length: 14 }, (_, i) => `${i % 12}.${i < 12 ? 'major' : 'blues'}`);
    const scaleReview = parseScaleDrillId(
      idOf(scaleReviewRoute({ ...DEFAULT_SCALE_DRILL_PREFS, level: 8 }, scales, 7)),
    );
    expect(scaleReview).toMatchObject({ level: 8, count: 12, only: true });
  });

  it('adds what is due to the setup pages’ weak line', () => {
    expect(dueNote(null, false)).toBe('');
    expect(dueNote({ kinds: [], outside: 0 }, false)).toBe('');
    expect(dueNote({ kinds: ['0.maj', '9.min'], outside: 1 }, false)).toBe(
      'Due for review: 2. Due outside this level: 1.',
    );
    expect(dueNote({ kinds: [], outside: 3 }, true)).toBe('Due outside this set: 3.');
  });
});
