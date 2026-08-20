import { formatDateShort } from '@/domain/model/date';
import { formatWeight } from '@/domain/model/units';
import { READINGS_BEFORE_A_TREND } from '@/domain/usecases/weighing';
import { Button, Card, ChapterTag, Empty, Field, Hint, Stack } from '@/ui/components/ui';
import { WeightChart } from './WeightChart';
import { useWeighingViewModel } from './useWeighingViewModel';
import styles from './weighing.module.css';

export function WeighingScreen() {
  const { state, entry, setEntry, canRecord, record } = useWeighingViewModel();
  if (state.status === 'loading') return <Empty>Opening weighing…</Empty>;

  const remaining = READINGS_BEFORE_A_TREND - state.trend.points.length;

  return (
    <Stack>
      <header>
        <Stack tight>
          <h1>Weight</h1>
          <div>
            <ChapterTag chapter="Step 1 · Ch. 10" />
          </div>
        </Stack>
      </header>

      <Card>
        <Stack>
          {state.alreadyWeighedToday ? (
            <Empty>Recorded for today.</Empty>
          ) : (
            <>
              <div className={styles.entryRow}>
                <Field label={`Weight (${state.unit})`}>
                  {/*
                    Deliberately a text field. type="number" refuses a comma in
                    locales that use one and hands back an empty string, so the
                    entry vanishes as it is typed. inputMode keeps the numeric
                    keypad; the value is parsed in the view model.
                  */}
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={entry}
                    onChange={(event) => setEntry(event.target.value)}
                    placeholder={(0).toLocaleString(undefined, { minimumFractionDigits: 1 })}
                  />
                </Field>
                <Button variant="primary" onClick={() => void record()} disabled={!canRecord}>
                  Record
                </Button>
              </div>
              {state.isWeighDayToday ? (
                <Hint>Your weigh day.</Hint>
              ) : (
                <Hint>
                  Your weigh day is {state.weighDayName}. A reading today is kept, but stays out of
                  the trend.
                </Hint>
              )}
            </>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <h2>Trend</h2>
          {state.trend.points.length === 0 ? (
            <Empty>No readings yet.</Empty>
          ) : (
            <>
              <WeightChart trend={state.trend} unit={state.unit} />
              {!state.trend.readable ? (
                <Hint>
                  {remaining === 1
                    ? 'One more weekly reading before the line means anything.'
                    : `${remaining} more weekly readings before the line means anything.`}
                </Hint>
              ) : null}
            </>
          )}
        </Stack>
      </Card>

      {state.offSchedule.length > 0 ? (
        <Card>
          <Stack tight>
            <h3>Off-schedule readings</h3>
            <ul className={styles.offList}>
              {state.offSchedule.map((weighing) => (
                <li key={weighing.date}>
                  {formatDateShort(weighing.date)} · {formatWeight(weighing.weightGrams, state.unit)}
                </li>
              ))}
            </ul>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}
