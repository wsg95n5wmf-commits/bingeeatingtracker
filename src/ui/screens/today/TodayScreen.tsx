import { Link } from 'react-router-dom';
import { formatDateLong } from '@/domain/model/date';
import { formatCountdown } from '@/domain/usecases/nextUp';
import { Button, Card, ChapterTag, Empty, Hint, Stack } from '@/ui/components/ui';
import { useTodayViewModel } from './useTodayViewModel';
import styles from './today.module.css';

export function TodayScreen() {
  const { state } = useTodayViewModel();
  if (state.status === 'loading') return <Empty>Opening today…</Empty>;

  const { day, next, phase } = state;

  return (
    <Stack>
      <header>
        <Stack tight>
          <h1>{formatDateLong(state.date)}</h1>
          <div className={styles.phase}>
            <ChapterTag chapter={`${phase.label} · ${phase.chapter}`} />
          </div>
        </Stack>
      </header>

      <Card>
        {next ? (
          <div className={styles.next}>
            <div className={styles.nextLabel}>{next.overdue ? 'Due' : 'Next'}</div>
            <div className={styles.nextName}>{next.item.item.label}</div>
            <div className={`${styles.nextWhen} ${next.overdue ? styles.overdue : ''}`}>
              {next.item.item.time} ·{' '}
              {next.overdue
                ? `${formatCountdown(next.minutesAway)} ago`
                : `in ${formatCountdown(next.minutesAway)}`}
            </div>
          </div>
        ) : state.hasPlan ? (
          <Empty>Everything on today's plan is done.</Empty>
        ) : (
          <Stack>
            <Empty>No plan for today yet.</Empty>
            <Link to={`/plan/${state.date}`}>
              <Button variant="primary" full>
                Plan today
              </Button>
            </Link>
          </Stack>
        )}
      </Card>

      {day.planned.length > 0 ? (
        <Card>
          <div className={styles.timeline}>
            {day.planned.map((view) => (
              <div
                key={view.item.id}
                className={[
                  styles.slot,
                  view.status === 'eaten' ? styles.eaten : '',
                  view.status === 'missed' ? styles.missed : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={styles.slotTime}>{view.item.time}</span>
                <span className={styles.slotName}>{view.item.label}</span>
                <span className={view.status === 'eaten' ? styles.tick : styles.pendingMark}>
                  {view.status === 'eaten' ? '✓' : '○'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Link to="/record">
        <Button variant="primary" full>
          Add an entry
        </Button>
      </Link>

      <div className={styles.prompts}>
        {state.weighDueToday && !state.weighedToday ? (
          <Link to="/weight" className={`${styles.prompt} ${styles.promptAccent}`}>
            <span>Weigh-in day</span>
            <span className={styles.chev}>›</span>
          </Link>
        ) : null}

        {state.weekAwaitingReview ? (
          <Link
            to={`/review/weekly/${state.weekAwaitingReview.start}`}
            className={`${styles.prompt} ${styles.promptAccent}`}
          >
            <span>Week {state.weekAwaitingReview.weekNumber} is ready to review</span>
            <span className={styles.chev}>›</span>
          </Link>
        ) : null}

        <Link to={`/record/${state.date}`} className={styles.prompt}>
          <span>
            Today's record
            {day.episodes.length > 0 ? ` · ${day.episodes.length}` : ''}
          </span>
          <span className={styles.chev}>›</span>
        </Link>

        {state.hasPlan ? (
          <Link to={`/plan/${state.date}`} className={styles.prompt}>
            <span>Today's plan</span>
            <span className={styles.chev}>›</span>
          </Link>
        ) : null}
      </div>

      <Hint>
        This app holds the records. The program itself is in the book — see {phase.chapter}.
      </Hint>
    </Stack>
  );
}
