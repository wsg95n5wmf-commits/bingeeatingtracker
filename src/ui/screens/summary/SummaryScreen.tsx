import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import { formatDateShort } from '@/domain/model/date';
import { formatWeight } from '@/domain/model/units';
import { Card, ChapterTag, Empty, Hint, Stack } from '@/ui/components/ui';
import styles from './summary.module.css';

export function SummaryScreen() {
  const { profile, summaries } = useRepositories();
  const data = useLiveQuery(async () => ({
    profile: await profile.get(),
    rows: await summaries.all(),
  }));

  if (!data) return <Empty>Opening the summary sheet…</Empty>;

  return (
    <Stack>
      <header>
        <Stack tight>
          <h1>Summary sheet</h1>
          <div>
            <ChapterTag chapter="Step 1 · Ch. 10" />
          </div>
        </Stack>
      </header>

      {data.rows.length === 0 ? (
        <Card>
          <Empty>No weeks recorded yet. A row is written when you finish a weekly review.</Empty>
        </Card>
      ) : (
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Wk</th>
                <th scope="col">B</th>
                <th scope="col">V</th>
                <th scope="col">L</th>
                <th scope="col">CD</th>
                <th scope="col">Weight</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.weekStart} className={row.reviewed ? '' : styles.unreviewed}>
                  <th scope="row">
                    {row.weekNumber}
                    <span className={styles.dates}>{formatDateShort(row.weekStart)}</span>
                  </th>
                  <td>{row.binges ?? '—'}</td>
                  <td>{row.vomits}</td>
                  <td>{row.laxatives}</td>
                  <td>{row.changeDays ?? '—'}</td>
                  <td>
                    {row.weightGrams === undefined
                      ? '—'
                      : formatWeight(row.weightGrams, data.profile.weightUnit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.rows.some((row) => !row.reviewed) ? (
        <Hint>Greyed rows were filled in from your records because that week was not reviewed.</Hint>
      ) : null}

      {data.rows.some((row) => row.notes !== '') ? (
        <Card>
          <Stack tight>
            <h2>Notes</h2>
            {data.rows
              .filter((row) => row.notes !== '')
              .map((row) => (
                <p key={row.weekStart} className={styles.note}>
                  <strong>Week {row.weekNumber}</strong> · {row.notes}
                </p>
              ))}
          </Stack>
        </Card>
      ) : null}

      <Hint>B binges · V vomiting · L laxatives · CD change days</Hint>
    </Stack>
  );
}
