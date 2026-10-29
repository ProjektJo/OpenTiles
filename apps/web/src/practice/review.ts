// Spaced review in the app (P7-27, ADR 0026): the chords and scales due today among those the
// learner's choices draw, and the drills that review them. The schedule is replayed from the kept
// rounds in packages/practice (review.ts); nothing new is stored.
import {
  chordDrillId,
  dueChordKinds,
  dueScaleKinds,
  kindTotals,
  MAX_REVIEWS,
  scaleDrillId,
  scaleTotals,
} from '@opentiles/practice';
import type { ChordStats, ScaleStats } from '@opentiles/practice';
import type { Route } from '../lib/router';
import { t } from '../i18n';
import { chordDrillOptions, drawnChordKinds } from './chord-drill';
import type { ChordDrillPrefs } from './chord-drill';
import { newSeed } from './drill';
import { drawnScaleKinds, scaleDrillOptions } from './scale-drill';
import type { ScaleDrillPrefs } from './scale-drill';

/** Chords or scales due for review today. */
export interface DueKinds {
  /** Those the learner's choices draw, the longest overdue first. */
  kinds: string[];
  /** How many more are due that the choices do not draw, within the day's reviews. */
  outside: number;
}

/** The chords due today: those the learner's level or set draws, and how many more are due. */
export function dueChords(stats: ChordStats, prefs: ChordDrillPrefs, now = Date.now()): DueKinds {
  const drawn = drawnChordKinds(prefs);
  const kinds = dueChordKinds(stats, now, drawn);
  const others = new Set(
    kindTotals(stats)
      .map((k) => k.kind)
      .filter((k) => !drawn.has(k)),
  );
  return { kinds, outside: dueChordKinds(stats, now, others, MAX_REVIEWS - kinds.length).length };
}

/** The scales due today: those the learner's level or set draws, and how many more are due. */
export function dueScales(stats: ScaleStats, prefs: ScaleDrillPrefs, now = Date.now()): DueKinds {
  const drawn = drawnScaleKinds(prefs);
  const kinds = dueScaleKinds(stats, now, drawn);
  const others = new Set(
    scaleTotals(stats)
      .map((k) => k.kind)
      .filter((k) => !drawn.has(k)),
  );
  return { kinds, outside: dueScaleKinds(stats, now, others, MAX_REVIEWS - kinds.length).length };
}

/**
 * What the setup pages add to the weak line: how many are due, and how many more are due outside
 * the learner's level or own set, which Review now does not draw.
 */
export function dueNote(due: DueKinds | null, custom: boolean): string {
  if (!due) return '';
  const outside = due.outside;
  return [
    due.kinds.length > 0 ? t('Due for review: {n}.', { n: due.kinds.length }) : '',
    outside === 0
      ? ''
      : custom
        ? t('Due outside this set: {n}.', { n: outside })
        : t('Due outside this level: {n}.', { n: outside }),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The practice screen's link for a review of the due chords: the learner's choices, asking each due
 * chord once, as a flash card is asked once. A chord asked again in the same round is played from
 * the memory just made, and a forgotten chord would pass.
 */
export function chordReviewRoute(
  prefs: ChordDrillPrefs,
  due: readonly string[],
  seed = newSeed(),
): Route {
  const o = chordDrillOptions(prefs, seed, [...due]);
  return {
    name: 'practice',
    source: 'drill',
    id: chordDrillId({ ...o, count: due.length, only: true }),
  };
}

/** The same for the due scales; a round has at most `MAX_SCALE_COUNT`, the rest come next. */
export function scaleReviewRoute(
  prefs: ScaleDrillPrefs,
  due: readonly string[],
  seed = newSeed(),
): Route {
  const o = scaleDrillOptions(prefs, seed, [...due]);
  return {
    name: 'practice',
    source: 'drill',
    id: scaleDrillId({ ...o, count: due.length, only: true }),
  };
}
