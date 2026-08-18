import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import {
  instant,
  toLocalDate,
  type LocalDate,
  type TimeOfDay,
} from '@/domain/model/date';
import type { PlannedItemId } from '@/domain/model/ids';
import {
  DEFAULT_TEMPLATE_ITEMS,
  type DayPlan,
  type PlanTiming,
  type PlannedItem,
  type PlannedItemKind,
} from '@/domain/model/plan';
import { breachingGaps, gapsIn, sortByTime, type PlanGap } from '@/domain/usecases/planGaps';

/**
 * The program asks for the day to be planned the evening before or that
 * morning, so the app records which of those it was rather than assuming.
 */
function timingFor(target: LocalDate, now: Date): PlanTiming {
  const today = toLocalDate(now);
  if (target > today) return 'evening-before';
  if (target === today) return now.getHours() < 11 ? 'morning-of' : 'during-the-day';
  return 'during-the-day';
}

function withId(item: Omit<PlannedItem, 'id'>): PlannedItem {
  return { ...item, id: crypto.randomUUID() as PlannedItemId };
}

export function usePlanViewModel(date: LocalDate) {
  const { plans } = useRepositories();
  // Wrapped in an object so "still loading" (undefined) is distinguishable from
  // "loaded, and there is no plan for this day" ({ plan: undefined }).
  const loaded = useLiveQuery(async () => ({ plan: await plans.forDate(date) }), [date]);
  const stored = loaded?.plan;
  const [items, setItems] = useState<PlannedItem[] | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  // Hydrate once per day. Re-running on every live-query emission would discard
  // edits in progress and clear the "Saved" state the moment a save landed.
  const hydratedFor = useRef<LocalDate | undefined>(undefined);
  useEffect(() => {
    if (!loaded || hydratedFor.current === date) return;
    hydratedFor.current = date;
    setItems(loaded.plan ? [...loaded.plan.items] : []);
    setNotes(loaded.plan?.notes ?? '');
    setSaved(false);
  }, [loaded, date]);

  const working = items ?? [];

  const gaps: readonly PlanGap[] = useMemo(() => gapsIn(working), [working]);
  const breaches = useMemo(() => breachingGaps(working), [working]);

  const startFromTemplate = useCallback(() => {
    setItems(DEFAULT_TEMPLATE_ITEMS.map(withId));
    setSaved(false);
  }, []);

  const addItem = useCallback(() => {
    setItems((current) => [
      ...(current ?? []),
      withId({ kind: 'snack', label: 'Snack', time: '15:00' as TimeOfDay }),
    ]);
    setSaved(false);
  }, []);

  const updateItem = useCallback((id: PlannedItemId, changes: Partial<Omit<PlannedItem, 'id'>>) => {
    setItems((current) =>
      (current ?? []).map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
    setSaved(false);
  }, []);

  const removeItem = useCallback((id: PlannedItemId) => {
    setItems((current) => (current ?? []).filter((item) => item.id !== id));
    setSaved(false);
  }, []);

  const save = useCallback(async () => {
    const now = new Date();
    const plan: DayPlan = {
      date,
      items: sortByTime(working),
      // The timing of the *first* save is what the program cares about.
      createdAt: stored?.createdAt ?? instant(now.getTime()),
      timing: stored?.timing ?? timingFor(date, now),
      notes,
    };
    await plans.save(plan);
    setSaved(true);
  }, [date, notes, plans, stored, working]);

  return {
    state: {
      status: loaded === undefined || items === undefined ? ('loading' as const) : ('ready' as const),
      date,
      items: sortByTime(working),
      gaps,
      breaches,
      notes,
      saved,
      hasPlan: stored !== undefined,
      timing: stored?.timing,
    },
    setNotes: (value: string) => {
      setNotes(value);
      setSaved(false);
    },
    startFromTemplate,
    addItem,
    updateItem,
    removeItem,
    setKind: (id: PlannedItemId, kind: PlannedItemKind) => updateItem(id, { kind }),
    save,
  } as const;
}
