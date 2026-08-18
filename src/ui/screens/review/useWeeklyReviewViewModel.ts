import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useRepositories } from '@/app/repositories';
import { instant, toLocalDate, type LocalDate } from '@/domain/model/date';
import type { Episode } from '@/domain/model/episode';
import type { ReviewId } from '@/domain/model/ids';
import {
  PATTERN_QUESTIONS,
  phaseQuestions,
  type DayComputedCounts,
  type DayReviewAnswer,
  type ReviewDecision,
  type ReviewSession,
} from '@/domain/model/review';
import type { Grams } from '@/domain/model/units';
import { compensatoryCounts } from '@/domain/usecases/dayView';
import { datesOf, weekContaining, type ProgramWeek } from '@/domain/usecases/programWeek';
import { summaryFromReview } from '@/domain/usecases/summaries';
import { advancementAdvice } from '@/domain/usecases/advancement';

/** The walkthrough runs: intro, then a page per day, then the questions, then the close. */
export type Stage =
  | { readonly kind: 'intro' }
  | { readonly kind: 'day'; readonly date: LocalDate; readonly index: number }
  | { readonly kind: 'patterns' }
  | { readonly kind: 'phase' }
  | { readonly kind: 'close' };

function emptyAnswer(date: LocalDate): DayReviewAnswer {
  return {
    date,
    monitoredAccurately: false,
    bingeCount: 0,
    vomits: 0,
    laxatives: 0,
    diuretics: 0,
    wasChangeDay: false,
    note: '',
  };
}

export function useWeeklyReviewViewModel(weekStart: LocalDate) {
  const { episodes, profile, reviews, summaries, weighings } = useRepositories();
  const navigate = useNavigate();

  const [stageIndex, setStageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DayReviewAnswer>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [written, setWritten] = useState<Record<string, string>>({});
  const [weekNote, setWeekNote] = useState('');
  const [decision, setDecision] = useState<ReviewDecision | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  const data = useLiveQuery(async () => {
    const currentProfile = await profile.get();
    const week = weekContaining(weekStart, currentProfile.reviewDay, currentProfile.programStartDate);
    return {
      profile: currentProfile,
      week,
      episodes: await episodes.inRange(week.start, week.end),
      weighings: await weighings.inRange(week.start, week.end),
      existing: await reviews.forWeek(week.start),
    };
  }, [weekStart]);

  // Resume a half-finished review rather than starting over.
  useEffect(() => {
    if (!data || hydrated) return;
    const existing = data.existing;
    if (existing) {
      const restored: Record<string, DayReviewAnswer> = {};
      const seen: Record<string, boolean> = {};
      for (const answer of existing.dayAnswers) {
        restored[answer.date] = answer;
        seen[answer.date] = true;
      }
      setAnswers(restored);
      setRevealed(seen);
      setWritten({ ...existing.answers });
      setWeekNote(existing.weekNote);
      if (existing.decision) setDecision(existing.decision);
    }
    setHydrated(true);
  }, [data, hydrated]);

  const week: ProgramWeek | undefined = data?.week;
  const days = useMemo(() => (week ? datesOf(week) : []), [week]);

  const stages: Stage[] = useMemo(
    () => [
      { kind: 'intro' },
      ...days.map((date, index) => ({ kind: 'day' as const, date, index })),
      { kind: 'patterns' as const },
      ...(phaseQuestions(data?.profile.phase ?? 'step-1').length > 0
        ? [{ kind: 'phase' as const }]
        : []),
      { kind: 'close' as const },
    ],
    [days, data?.profile.phase],
  );

  const byDate = useMemo(() => {
    const grouped = new Map<string, Episode[]>();
    for (const episode of data?.episodes ?? []) {
      const list = grouped.get(episode.date) ?? [];
      list.push(episode);
      grouped.set(episode.date, list);
    }
    return grouped;
  }, [data?.episodes]);

  const persist = useCallback(
    async (
      nextAnswers: Record<string, DayReviewAnswer>,
      nextWritten: Record<string, string>,
      nextNote: string,
      nextDecision: ReviewDecision | undefined,
      complete: boolean,
    ) => {
      if (!data || !week) return;
      const weighing = data.weighings.find((entry) => !entry.offSchedule) ?? data.weighings[0];
      const session: ReviewSession = {
        id: (data.existing?.id ?? crypto.randomUUID()) as ReviewId,
        kind: 'weekly',
        phase: data.profile.phase,
        weekStart: week.start,
        weekEnd: week.end,
        startedAt: data.existing?.startedAt ?? instant(Date.now()),
        ...(complete ? { completedAt: instant(Date.now()) } : {}),
        dayAnswers: days.map((date) => nextAnswers[date]).filter((a): a is DayReviewAnswer => !!a),
        answers: nextWritten,
        ...(weighing ? { weightGrams: weighing.weightGrams as Grams } : {}),
        weekNote: nextNote,
        ...(nextDecision ? { decision: nextDecision } : {}),
      };
      await reviews.save(session);
      if (complete) {
        await summaries.save(summaryFromReview(session, week.weekNumber));
      }
    },
    [data, days, reviews, summaries, week],
  );

  const commitDay = useCallback(
    (answer: DayReviewAnswer) => {
      const next = { ...answers, [answer.date]: answer };
      setAnswers(next);
      setRevealed((current) => ({ ...current, [answer.date]: true }));
      void persist(next, written, weekNote, decision, false);
    },
    [answers, decision, persist, weekNote, written],
  );

  const reviseDay = useCallback((date: LocalDate) => {
    setRevealed((current) => ({ ...current, [date]: false }));
  }, []);

  const computedFor = useCallback(
    (date: LocalDate): DayComputedCounts => compensatoryCounts(byDate.get(date) ?? []),
    [byDate],
  );

  const finish = useCallback(async () => {
    await persist(answers, written, weekNote, decision, true);
    void navigate('/summary');
  }, [answers, decision, navigate, persist, weekNote, written]);

  const draftSummary = useMemo(() => {
    if (!week) return undefined;
    const collected = days.map((date) => answers[date]).filter((a): a is DayReviewAnswer => !!a);
    return summaryFromReview(
      {
        id: '' as ReviewId,
        kind: 'weekly',
        phase: data?.profile.phase ?? 'step-1',
        weekStart: week.start,
        weekEnd: week.end,
        startedAt: instant(0),
        dayAnswers: collected,
        answers: written,
        weekNote,
      },
      week.weekNumber,
    );
  }, [answers, data?.profile.phase, days, week, weekNote, written]);

  const stage = stages[Math.min(stageIndex, stages.length - 1)] ?? { kind: 'intro' };

  return {
    loading: !data || !hydrated,
    week,
    phase: data?.profile.phase ?? 'step-1',
    today: toLocalDate(new Date()),
    stage,
    stageIndex,
    stageCount: stages.length,
    answers,
    revealed,
    written,
    weekNote,
    decision,
    draftSummary,
    advice: draftSummary ? advancementAdvice(draftSummary) : undefined,
    patternQuestions: PATTERN_QUESTIONS,
    stepQuestions: phaseQuestions(data?.profile.phase ?? 'step-1'),
    episodesFor: (date: LocalDate) => byDate.get(date) ?? [],
    computedFor,
    answerFor: (date: LocalDate) => answers[date] ?? emptyAnswer(date),
    commitDay,
    reviseDay,
    setWritten: (id: string, value: string) => setWritten((current) => ({ ...current, [id]: value })),
    setWeekNote,
    setDecision,
    next: () => setStageIndex((index) => Math.min(index + 1, stages.length - 1)),
    back: () => setStageIndex((index) => Math.max(index - 1, 0)),
    finish,
  } as const;
}
