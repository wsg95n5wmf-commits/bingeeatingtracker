import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addDays,
  formatDateLong,
  localDate,
  toLocalDate,
  type LocalDate,
} from '@/domain/model/date';
import { minutesAfterTheFact, isRealTime } from '@/domain/model/episode';
import type { EpisodeView } from '@/domain/usecases/dayView';
import { Button, Card, Empty, Hint, Stack } from '@/ui/components/ui';
import { EpisodeForm } from './EpisodeForm';
import { useRecordViewModel } from './useRecordViewModel';
import styles from './record.module.css';

function compensatoryMark(view: EpisodeView): string {
  const { episode } = view;
  return [episode.vomited ? 'V' : '', episode.laxatives ? 'L' : '', episode.diuretics ? 'D' : '']
    .filter(Boolean)
    .join('/');
}

export function RecordScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const date = params.date ? localDate(params.date) : toLocalDate(new Date());
  const vm = useRecordViewModel(date);

  const goTo = (target: LocalDate): void => {
    void navigate(`/record/${target}`);
  };

  if (vm.state.status === 'loading') return <Empty>Opening the record…</Empty>;
  const { day, isToday } = vm.state;

  return (
    <Stack>
      <div className={styles.dateBar}>
        <h1>{isToday ? 'Today' : formatDateLong(date)}</h1>
        <div className={styles.stepper}>
          <Button onClick={() => goTo(addDays(date, -1))} aria-label="Previous day">
            ‹
          </Button>
          <Button onClick={() => goTo(addDays(date, 1))} aria-label="Next day" disabled={isToday}>
            ›
          </Button>
        </div>
      </div>

      <div className={styles.record}>
        <div className={styles.head}>
          <span>Time</span>
          <span>Food and drink · where · what was going on</span>
          <span aria-label="Excessive">*</span>
          <span>V/L</span>
        </div>

        {day.episodes.length === 0 ? (
          <Empty>Nothing recorded yet.</Empty>
        ) : (
          day.episodes.map((view) => {
            const chained = view.chain !== undefined && view.chain.length > 1;
            const classes = [
              styles.entry,
              chained ? styles.chain : '',
              chained && view.chain?.index === 0 ? styles.chainStart : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={view.episode.id}
                type="button"
                className={classes}
                onClick={() => vm.startEditing(view.episode)}
              >
                <span className={styles.time}>
                  {view.episode.time}
                  {!isRealTime(view.episode) ? (
                    <>
                      <br />
                      <span className={styles.late}>+{minutesAfterTheFact(view.episode)}m</span>
                    </>
                  ) : null}
                </span>
                <span className={styles.desc}>
                  <span className={view.episode.isMeal ? styles.meal : undefined}>
                    {view.episode.description}
                  </span>
                  {view.episode.place ? <div className={styles.place}>{view.episode.place}</div> : null}
                  {view.episode.context ? <div className={styles.context}>{view.episode.context}</div> : null}
                  {view.inGap && day.planned.length > 0 ? (
                    <div className={styles.gapTag}>outside the plan</div>
                  ) : null}
                </span>
                <span className={styles.star}>{view.episode.excessive ? '✱' : ''}</span>
                <span className={styles.vl}>{compensatoryMark(view)}</span>
              </button>
            );
          })
        )}
      </div>

      {vm.editing ? (
        <EpisodeForm
          date={date}
          defaultTime={vm.suggestedTime}
          plannedItems={vm.plannedItems}
          existing={vm.editing}
          onSubmit={(draft) => {
            if (vm.editing) {
              void vm.updateEpisode(vm.editing.id, draft);
            }
          }}
          onCancel={vm.cancelEditing}
          onDelete={() => {
            if (vm.editing) {
              void vm.removeEpisode(vm.editing.id);
            }
          }}
        />
      ) : vm.composing ? (
        <EpisodeForm
          date={date}
          defaultTime={vm.suggestedTime}
          plannedItems={vm.plannedItems}
          onSubmit={(draft) => void vm.addEpisode(draft)}
          onCancel={vm.cancelComposing}
        />
      ) : (
        <Button variant="primary" full onClick={vm.startComposing}>
          Add an entry
        </Button>
      )}

      {day.loggedLateCount > 0 ? (
        <Card>
          <Hint>
            {day.realTimeCount} of {day.realTimeCount + day.loggedLateCount} entries were written
            within half an hour of eating.
          </Hint>
        </Card>
      ) : null}

      <Hint>
        <Link to={`/plan/${date}`}>Plan for this day</Link>
      </Hint>
    </Stack>
  );
}
