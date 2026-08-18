import { useState } from 'react';
import { formatDateLong, type LocalDate } from '@/domain/model/date';
import type { Episode } from '@/domain/model/episode';
import type { DayComputedCounts, DayReviewAnswer } from '@/domain/model/review';
import { changeDayCriteria, type Phase } from '@/domain/model/phase';
import { buildDayView } from '@/domain/usecases/dayView';
import { Button, Card, Empty, Field, Hint, Stack } from '@/ui/components/ui';
import styles from './review.module.css';

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className={styles.counter}>
      <span>{label}</span>
      <div className={styles.counterControls}>
        <Button className={styles.counterButton} onClick={() => onChange(Math.max(0, value - 1))} aria-label={`One fewer ${label}`}>
          −
        </Button>
        <span className={styles.counterValue}>{value}</span>
        <Button className={styles.counterButton} onClick={() => onChange(value + 1)} aria-label={`One more ${label}`}>
          +
        </Button>
      </div>
    </div>
  );
}

interface Props {
  date: LocalDate;
  phase: Phase;
  episodes: readonly Episode[];
  answer: DayReviewAnswer;
  computed: DayComputedCounts;
  revealed: boolean;
  /** True when this day was already committed once, so the answers are restored. */
  answered: boolean;
  onCommit: (answer: DayReviewAnswer) => void;
  onRevise: () => void;
}

/**
 * Until the user answers, the yes/no questions are genuinely unanswered — so
 * they are held as `undefined` rather than defaulting to "no", which would put
 * an answer in the user's mouth and quietly deflate the change-day count.
 */
type DayDraft = Omit<DayReviewAnswer, 'monitoredAccurately' | 'wasChangeDay'> & {
  monitoredAccurately?: boolean | undefined;
  wasChangeDay?: boolean | undefined;
};

export function DayWalkthrough({
  date,
  phase,
  episodes,
  answer,
  computed,
  revealed,
  answered,
  onCommit,
  onRevise,
}: Props) {
  const [draft, setDraft] = useState<DayDraft>(
    answered ? answer : { ...answer, monitoredAccurately: undefined, wasChangeDay: undefined },
  );
  const view = buildDayView(episodes, undefined);

  const set = <K extends keyof DayDraft>(key: K, value: DayDraft[K]): void =>
    setDraft((current) => ({ ...current, [key]: value }));

  const complete = draft.monitoredAccurately !== undefined && draft.wasChangeDay !== undefined;

  const mismatch =
    draft.vomits !== computed.vomits ||
    draft.laxatives !== computed.laxatives ||
    draft.diuretics !== computed.diuretics;

  return (
    <Stack>
      <h2>{formatDateLong(date)}</h2>

      <div className={styles.dayRecord}>
        {view.episodes.length === 0 ? (
          <Empty>Nothing was recorded on this day.</Empty>
        ) : (
          view.episodes.map((entry) => (
            <div
              key={entry.episode.id}
              className={`${styles.dayRow} ${entry.chain && entry.chain.length > 1 ? styles.chain : ''}`}
            >
              <span className={styles.rowTime}>{entry.episode.time}</span>
              <span>
                {entry.episode.description}
                {entry.episode.context ? (
                  <div className={styles.rowContext}>{entry.episode.context}</div>
                ) : null}
              </span>
              <span className={styles.rowStar}>{entry.episode.excessive ? '✱' : ''}</span>
              <span className={styles.rowVl}>
                {[
                  entry.episode.vomited ? 'V' : '',
                  entry.episode.laxatives ? 'L' : '',
                  entry.episode.diuretics ? 'D' : '',
                ]
                  .filter(Boolean)
                  .join('/')}
              </span>
            </div>
          ))
        )}
      </div>

      {revealed ? (
        <Card>
          <Stack tight>
            <div className={mismatch ? `${styles.compare} ${styles.compareMismatch}` : styles.compare}>
              <div className={styles.compareRow}>
                <span>Vomiting — you said {draft.vomits}</span>
                <span>records show {computed.vomits}</span>
              </div>
              <div className={styles.compareRow}>
                <span>Laxatives — you said {draft.laxatives}</span>
                <span>records show {computed.laxatives}</span>
              </div>
              <div className={styles.compareRow}>
                <span>Diuretics — you said {draft.diuretics}</span>
                <span>records show {computed.diuretics}</span>
              </div>
            </div>
            {mismatch ? (
              <Hint>These differ. Look again if you want to change either one.</Hint>
            ) : (
              <Hint>Your count matches the record.</Hint>
            )}
            <Button onClick={onRevise}>Change my answers</Button>
          </Stack>
        </Card>
      ) : (
        <Card>
          <Stack>
            <Field label="How many binges did you have?" hint="Count the chains of asterisks above.">
              <Counter label="Binges" value={draft.bingeCount} onChange={(next) => set('bingeCount', next)} />
            </Field>

            <Counter label="Vomiting" value={draft.vomits} onChange={(next) => set('vomits', next)} />
            <Counter label="Laxatives" value={draft.laxatives} onChange={(next) => set('laxatives', next)} />
            <Counter label="Diuretics" value={draft.diuretics} onChange={(next) => set('diuretics', next)} />

            <div>
              <span className={styles.summaryLine}>Did you monitor accurately?</span>
              <div className={styles.toggleRow}>
                <button
                  type="button"
                  className={`${styles.toggle} ${draft.monitoredAccurately === true ? styles.toggleOn : ''}`}
                  onClick={() => set('monitoredAccurately', true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`${styles.toggle} ${draft.monitoredAccurately === false ? styles.toggleOn : ''}`}
                  onClick={() => set('monitoredAccurately', false)}
                >
                  No
                </button>
              </div>
            </div>

            <div>
              <span className={styles.summaryLine}>Was this a change day?</span>
              <Hint>{changeDayCriteria(phase).join(' · ')}</Hint>
              <div className={styles.toggleRow}>
                <button
                  type="button"
                  className={`${styles.toggle} ${draft.wasChangeDay === true ? styles.toggleOn : ''}`}
                  onClick={() => set('wasChangeDay', true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`${styles.toggle} ${draft.wasChangeDay === false ? styles.toggleOn : ''}`}
                  onClick={() => set('wasChangeDay', false)}
                >
                  No
                </button>
              </div>
            </div>

            <Field label="Anything notable about this day">
              <textarea value={draft.note} onChange={(event) => set('note', event.target.value)} />
            </Field>

            <Button
              variant="primary"
              full
              disabled={!complete}
              onClick={() => {
                if (draft.monitoredAccurately === undefined || draft.wasChangeDay === undefined) return;
                onCommit({
                  ...draft,
                  monitoredAccurately: draft.monitoredAccurately,
                  wasChangeDay: draft.wasChangeDay,
                });
              }}
            >
              Save this day
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
