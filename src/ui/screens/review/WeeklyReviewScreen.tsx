import { useParams } from 'react-router-dom';
import { localDate } from '@/domain/model/date';
import { CHANGE_DAYS_TO_ADVANCE } from '@/domain/model/summary';
import { Button, Card, ChapterTag, Empty, Field, Hint, Stack } from '@/ui/components/ui';
import { DayWalkthrough } from './DayWalkthrough';
import { useWeeklyReviewViewModel } from './useWeeklyReviewViewModel';
import styles from './review.module.css';

export function WeeklyReviewScreen() {
  const params = useParams();
  const weekStart = localDate(params.weekStart ?? '');
  const vm = useWeeklyReviewViewModel(weekStart);

  if (vm.loading || !vm.week) return <Empty>Opening the review…</Empty>;

  const { stage } = vm;

  return (
    <Stack>
      <header>
        <Stack tight>
          <h1>Week {vm.week.weekNumber} review</h1>
          <div>
            <ChapterTag chapter="Step 1 · Ch. 10" />
          </div>
          <div className={styles.progress}>
            {Array.from({ length: vm.stageCount }, (_, index) => (
              <span
                key={index}
                className={`${styles.tick} ${index <= vm.stageIndex ? styles.tickDone : ''}`}
              />
            ))}
          </div>
        </Stack>
      </header>

      {stage.kind === 'intro' ? (
        <Card>
          <Stack>
            <h2>Set aside some time</h2>
            <Hint>
              This goes through each of the seven days, then the week as a whole. It takes about 20
              to 30 minutes. You can stop and come back — your answers are kept.
            </Hint>
            <Button variant="primary" full onClick={vm.next}>
              Begin
            </Button>
          </Stack>
        </Card>
      ) : null}

      {stage.kind === 'day' ? (
        <DayWalkthrough
          key={stage.date}
          date={stage.date}
          phase={vm.phase}
          episodes={vm.episodesFor(stage.date)}
          answer={vm.answerFor(stage.date)}
          computed={vm.computedFor(stage.date)}
          revealed={vm.revealed[stage.date] ?? false}
          answered={vm.answers[stage.date] !== undefined}
          onCommit={vm.commitDay}
          onRevise={() => vm.reviseDay(stage.date)}
        />
      ) : null}

      {stage.kind === 'patterns' ? (
        <Card>
          <Stack>
            <h2>The week as a whole</h2>
            {vm.patternQuestions.map((question) => (
              <Field key={question.id} label={question.prompt}>
                <textarea
                  value={vm.written[question.id] ?? ''}
                  onChange={(event) => vm.setWritten(question.id, event.target.value)}
                />
              </Field>
            ))}
          </Stack>
        </Card>
      ) : null}

      {stage.kind === 'phase' ? (
        <Card>
          <Stack>
            <h2>This step</h2>
            {vm.stepQuestions.map((question) => (
              <Field key={question.id} label={question.prompt}>
                <textarea
                  value={vm.written[question.id] ?? ''}
                  onChange={(event) => vm.setWritten(question.id, event.target.value)}
                />
              </Field>
            ))}
          </Stack>
        </Card>
      ) : null}

      {stage.kind === 'close' ? (
        <Stack>
          <Card>
            <Stack tight>
              <h2>Your week</h2>
              <div className={styles.summaryLine}>
                <span>Binges</span>
                <span className={styles.summaryValue}>{vm.draftSummary?.binges ?? 0}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Vomiting</span>
                <span className={styles.summaryValue}>{vm.draftSummary?.vomits ?? 0}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Laxatives</span>
                <span className={styles.summaryValue}>{vm.draftSummary?.laxatives ?? 0}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Diuretics</span>
                <span className={styles.summaryValue}>{vm.draftSummary?.diuretics ?? 0}</span>
              </div>
              <div className={styles.summaryLine}>
                <span>Change days</span>
                <span className={styles.summaryValue}>{vm.draftSummary?.changeDays ?? 0}</span>
              </div>
            </Stack>
          </Card>

          {vm.advice ? (
            <Card>
              <Hint>
                {vm.advice.enough
                  ? `${vm.advice.changeDays} change days. The program suggests ${CHANGE_DAYS_TO_ADVANCE} or more before moving on — the decision is yours.`
                  : `${vm.advice.changeDays} change days.`}
              </Hint>
            </Card>
          ) : null}

          <Card>
            <Stack>
              <Field label="Notes for this week" hint="Anything that shaped it — illness, travel, disruption.">
                <textarea value={vm.weekNote} onChange={(event) => vm.setWeekNote(event.target.value)} />
              </Field>

              <div>
                <span className={styles.summaryLine}>Staying on this step, or moving on?</span>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.toggle} ${vm.decision === 'stay' ? styles.toggleOn : ''}`}
                    onClick={() => vm.setDecision('stay')}
                  >
                    Staying
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggle} ${vm.decision === 'advance' ? styles.toggleOn : ''}`}
                    onClick={() => vm.setDecision('advance')}
                  >
                    Moving on
                  </button>
                </div>
                <Hint>Moving on changes nothing here — set your step in Settings when you decide.</Hint>
              </div>

              <Button variant="primary" full onClick={() => void vm.finish()}>
                Finish the review
              </Button>
            </Stack>
          </Card>
        </Stack>
      ) : null}

      {stage.kind !== 'close' ? (
        <div className={styles.nav}>
          <Button onClick={vm.back} disabled={vm.stageIndex === 0}>
            Back
          </Button>
          {stage.kind !== 'intro' ? (
            <Button variant="primary" onClick={vm.next}>
              {stage.kind === 'day' ? 'Next day' : 'Continue'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Stack>
  );
}
