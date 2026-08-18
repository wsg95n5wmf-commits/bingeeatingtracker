import { useState } from 'react';
import type { LocalDate, TimeOfDay } from '@/domain/model/date';
import type { Episode, EpisodeDraft } from '@/domain/model/episode';
import type { PlannedItem } from '@/domain/model/plan';
import type { PlannedItemId } from '@/domain/model/ids';
import { Button, Card, Field, Hint, Stack } from '@/ui/components/ui';
import styles from './record.module.css';

interface Props {
  date: LocalDate;
  defaultTime: TimeOfDay;
  plannedItems: readonly PlannedItem[];
  existing?: Episode;
  onSubmit: (draft: EpisodeDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function EpisodeForm({
  date,
  defaultTime,
  plannedItems,
  existing,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [time, setTime] = useState<string>(existing?.time ?? defaultTime);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isMeal, setIsMeal] = useState(existing?.isMeal ?? false);
  const [place, setPlace] = useState(existing?.place ?? '');
  const [excessive, setExcessive] = useState(existing?.excessive ?? false);
  const [vomited, setVomited] = useState(existing?.vomited ?? false);
  const [laxatives, setLaxatives] = useState(existing?.laxatives ?? false);
  const [diuretics, setDiuretics] = useState(existing?.diuretics ?? false);
  const [context, setContext] = useState(existing?.context ?? '');
  const [plannedItemId, setPlannedItemId] = useState<string>(existing?.plannedItemId ?? '');

  // Column 6 carries the circumstances that make the record worth keeping, so
  // it is asked for directly whenever a row is marked.
  const contextExpected = excessive || vomited || laxatives || diuretics;

  const submit = (): void => {
    if (description.trim() === '') return;
    onSubmit({
      date,
      time: time as TimeOfDay,
      description: description.trim(),
      isMeal,
      place: place.trim(),
      excessive,
      vomited,
      laxatives,
      diuretics,
      context: context.trim(),
      ...(plannedItemId === '' ? {} : { plannedItemId: plannedItemId as PlannedItemId }),
    });
  };

  return (
    <Card>
      <Stack>
        <div className={styles.formGrid}>
          <Field label="Time">
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </Field>
          <Field label="Where">
            <input
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              placeholder="Kitchen"
            />
          </Field>
        </div>

        <Field label="What you ate and drank">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Two slices of toast and butter, coffee"
            autoFocus
          />
        </Field>

        <label className={styles.check}>
          <input type="checkbox" checked={isMeal} onChange={(event) => setIsMeal(event.target.checked)} />
          This was a meal
        </label>

        {plannedItems.length > 0 ? (
          <Field label="Part of the plan">
            <select value={plannedItemId} onChange={(event) => setPlannedItemId(event.target.value)}>
              <option value="">Not planned</option>
              {plannedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.time} · {item.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <div className={styles.checks}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={excessive}
              onChange={(event) => setExcessive(event.target.checked)}
            />
            <span>Felt excessive at the time</span>
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={vomited} onChange={(event) => setVomited(event.target.checked)} />
            Vomited
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={laxatives}
              onChange={(event) => setLaxatives(event.target.checked)}
            />
            Laxatives
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={diuretics}
              onChange={(event) => setDiuretics(event.target.checked)}
            />
            Diuretics
          </label>
        </div>

        <div className={contextExpected ? styles.markPrompt : undefined}>
          <Field label="What was going on">
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Where you were, who with, what you were thinking and feeling"
            />
          </Field>
          {contextExpected && context.trim() === '' ? (
            <Hint>You marked this entry. What was happening at the time?</Hint>
          ) : null}
        </div>

        <div className={styles.formGrid}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={description.trim() === ''}>
            {existing ? 'Save' : 'Add entry'}
          </Button>
        </div>
        {onDelete ? (
          <Button variant="danger" onClick={onDelete}>
            Delete this entry
          </Button>
        ) : null}
      </Stack>
    </Card>
  );
}
