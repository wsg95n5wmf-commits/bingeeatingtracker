/**
 * The phases of the program. Only Steps 1 and 2 are built; the rest are listed
 * so the shape of the program is visible from the start.
 */
export type Phase =
  | 'getting-ready'
  | 'step-1'
  | 'step-2'
  | 'step-3'
  | 'step-4'
  | 'step-5'
  | 'dieting-module'
  | 'body-image-module'
  | 'ending-well';

export interface PhaseInfo {
  readonly id: Phase;
  readonly label: string;
  /** Where the user reads about this phase. The app does not explain it. */
  readonly chapter: string;
  readonly available: boolean;
}

export const PHASES: readonly PhaseInfo[] = [
  { id: 'getting-ready', label: 'Getting Ready', chapter: 'Ch. 9', available: false },
  { id: 'step-1', label: 'Step 1 · Starting Well', chapter: 'Ch. 10', available: true },
  { id: 'step-2', label: 'Step 2 · Regular Eating', chapter: 'Ch. 11', available: true },
  { id: 'step-3', label: 'Step 3 · Alternatives', chapter: 'Ch. 12', available: false },
  { id: 'step-4', label: 'Step 4 · Problem Solving', chapter: 'Ch. 13', available: false },
  { id: 'step-5', label: 'Step 5 · Taking Stock', chapter: 'Ch. 14', available: false },
  { id: 'dieting-module', label: 'Dieting Module', chapter: 'Ch. 15', available: false },
  { id: 'body-image-module', label: 'Body Image Module', chapter: 'Ch. 16', available: false },
  { id: 'ending-well', label: 'Ending Well', chapter: 'Ch. 17', available: false },
];

export function phaseInfo(phase: Phase): PhaseInfo {
  const found = PHASES.find((candidate) => candidate.id === phase);
  if (!found) throw new RangeError(`Unknown phase: ${phase}`);
  return found;
}

/** Step 2 adds the planning criteria to what a change day requires. */
export function changeDayCriteria(phase: Phase): readonly string[] {
  const monitoring = ['Monitored accurately', 'Kept to weekly weighing'];
  if (phase === 'step-2') {
    return [...monitoring, 'Planned the day', 'Ate the planned meals and snacks', 'Did not eat in the gaps'];
  }
  return monitoring;
}
