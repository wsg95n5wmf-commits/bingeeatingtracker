import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import { WEEKDAY_NAMES, formatDateShort, toLocalDate } from '@/domain/model/date';
import { checkInDue } from '@/domain/usecases/advancement';
import { weekAwaitingReview } from '@/domain/usecases/programWeek';
import { Card, ChapterTag, Empty, Hint, Stack } from '@/ui/components/ui';
import styles from '@/ui/screens/today/today.module.css';

export function ReviewHubScreen() {
  const { profile, reviews } = useRepositories();
  const today = toLocalDate(new Date());

  const data = useLiveQuery(async () => {
    const current = await profile.get();
    const candidate = weekAwaitingReview(today, current.reviewDay, current.programStartDate);
    return {
      profile: current,
      candidate,
      existing: candidate ? await reviews.forWeek(candidate.start) : undefined,
      lastCheckIn: await reviews.latestCompleted('check-in'),
      all: await reviews.all(),
    };
  }, [today]);

  if (!data) return <Empty>Opening reviews…</Empty>;

  const completed = data.all.filter(
    (session) => session.kind === 'weekly' && session.completedAt !== undefined,
  );
  const weeklyDone = data.existing?.completedAt !== undefined;
  const inProgress = data.existing !== undefined && !weeklyDone;

  return (
    <Stack>
      <header>
        <Stack tight>
          <h1>Reviews</h1>
          <div>
            <ChapterTag chapter="Step 1 · Ch. 10" />
          </div>
        </Stack>
      </header>

      <div className={styles.prompts}>
        {data.candidate && !weeklyDone ? (
          <Link
            to={`/review/weekly/${data.candidate.start}`}
            className={`${styles.prompt} ${styles.promptAccent}`}
          >
            <span>
              {inProgress ? 'Continue' : 'Start'} week {data.candidate.weekNumber} review
            </span>
            <span className={styles.chev}>›</span>
          </Link>
        ) : null}

        {checkInDue(today, data.lastCheckIn, data.profile.programStartDate) ? (
          <Link to="/review/check-in" className={styles.prompt}>
            <span>Check-in</span>
            <span className={styles.chev}>›</span>
          </Link>
        ) : (
          <Link to="/review/check-in" className={styles.prompt}>
            <span>Check-in (not due yet)</span>
            <span className={styles.chev}>›</span>
          </Link>
        )}

        <Link to="/summary" className={styles.prompt}>
          <span>Summary sheet</span>
          <span className={styles.chev}>›</span>
        </Link>
      </div>

      <Card>
        <Stack tight>
          <h2>Past weekly reviews</h2>
          {completed.length === 0 ? (
            <Empty>None yet.</Empty>
          ) : (
            completed.map((session) => (
              <Link key={session.id} to={`/review/weekly/${session.weekStart}`}>
                {formatDateShort(session.weekStart)} – {formatDateShort(session.weekEnd)}
              </Link>
            ))
          )}
        </Stack>
      </Card>

      <Hint>
        Weekly reviews fall on {WEEKDAY_NAMES[data.profile.reviewDay]}s. Change that in Settings.
      </Hint>
    </Stack>
  );
}
