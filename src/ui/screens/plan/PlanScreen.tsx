import { Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { formatDateLong, localDate, toLocalDate, type TimeOfDay } from '@/domain/model/date';
import type { PlannedItemId } from '@/domain/model/ids';
import { formatGap } from '@/domain/usecases/planGaps';
import { Button, Card, ChapterTag, Empty, Field, Hint, Stack } from '@/ui/components/ui';
import { usePlanViewModel } from './usePlanViewModel';
import styles from './plan.module.css';

const TIMING_LABEL = {
  'evening-before': 'Planned the evening before',
  'morning-of': 'Planned that morning',
  'during-the-day': 'Planned during the day',
} as const;

export function PlanScreen() {
  const params = useParams();
  const date = params.date ? localDate(params.date) : toLocalDate(new Date());
  const vm = usePlanViewModel(date);
  const { state } = vm;

  if (state.status === 'loading') return <Empty>Opening the plan…</Empty>;

  return (
    <Stack>
      <header>
        <Stack tight>
          <h1>Plan · {formatDateLong(date)}</h1>
          <div>
            <ChapterTag chapter="Step 2 · Ch. 11" />
          </div>
          {state.timing ? <p className={styles.timing}>{TIMING_LABEL[state.timing]}</p> : null}
        </Stack>
      </header>

      {state.items.length === 0 ? (
        <Card>
          <Stack>
            <Empty>No meals or snacks planned for this day.</Empty>
            <Button variant="primary" full onClick={vm.startFromTemplate}>
              Start from the usual pattern
            </Button>
            <Button full onClick={vm.addItem}>
              Add them one at a time
            </Button>
          </Stack>
        </Card>
      ) : (
        <Card>
          <Stack tight>
            {state.items.map((item, index) => {
              const gap = state.gaps[index - 1];
              return (
                <Fragment key={item.id}>
                  {gap ? (
                    <div
                      className={[
                        styles.gap,
                        gap.tooLong && !gap.morningException ? styles.gapBreach : '',
                        gap.morningException ? styles.gapException : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {formatGap(gap.minutes)}
                      {gap.tooLong && !gap.morningException ? ' · over four hours' : ''}
                      {gap.morningException ? ' · morning gap' : ''}
                    </div>
                  ) : null}

                  <div className={styles.item}>
                    <input
                      type="text"
                      className={styles.name}
                      value={item.label}
                      aria-label="Name"
                      onChange={(event) =>
                        vm.updateItem(item.id as PlannedItemId, { label: event.target.value })
                      }
                    />
                    <div className={styles.itemControls}>
                      <input
                        type="time"
                        className={styles.time}
                        value={item.time}
                        aria-label={`Time for ${item.label}`}
                        onChange={(event) =>
                          vm.updateItem(item.id as PlannedItemId, {
                            time: event.target.value as TimeOfDay,
                          })
                        }
                      />
                      <div className={styles.kindGroup} role="group" aria-label="Meal or snack">
                        {(['meal', 'snack'] as const).map((kind) => (
                          <button
                            key={kind}
                            type="button"
                            aria-pressed={item.kind === kind}
                            className={`${styles.kindOption} ${item.kind === kind ? styles.kindOn : ''}`}
                            onClick={() => vm.setKind(item.id as PlannedItemId, kind)}
                          >
                            {kind === 'meal' ? 'Meal' : 'Snack'}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={styles.remove}
                        aria-label={`Remove ${item.label}`}
                        onClick={() => vm.removeItem(item.id as PlannedItemId)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </Fragment>
              );
            })}

            <Button full onClick={vm.addItem}>
              Add another
            </Button>
          </Stack>
        </Card>
      )}

      {state.breaches.length > 0 ? (
        <Card>
          <Hint>
            {state.breaches.length === 1
              ? 'One gap runs over four hours.'
              : `${state.breaches.length} gaps run over four hours.`}
          </Hint>
        </Card>
      ) : null}

      <Card>
        <Field label="Notes for the day">
          <textarea value={state.notes} onChange={(event) => vm.setNotes(event.target.value)} />
        </Field>
      </Card>

      <Button variant="primary" full onClick={() => void vm.save()} disabled={state.items.length === 0}>
        {state.saved ? 'Saved' : 'Save plan'}
      </Button>
    </Stack>
  );
}
