import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRepositories } from '@/app/repositories';
import { instant, toLocalDate } from '@/domain/model/date';
import type { ReviewId } from '@/domain/model/ids';
import { CHECK_IN_QUESTIONS, phaseQuestions } from '@/domain/model/review';
import { weekContaining } from '@/domain/usecases/programWeek';
import { Button, Card, ChapterTag, Empty, Field, Hint, Stack } from '@/ui/components/ui';

/** The short review that falls between weekly ones: questions only, no walkthrough. */
export function CheckInScreen() {
  const { profile, reviews } = useRepositories();
  const navigate = useNavigate();
  const today = toLocalDate(new Date());
  const [written, setWritten] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');

  const data = useLiveQuery(async () => {
    const current = await profile.get();
    return {
      profile: current,
      week: weekContaining(today, current.reviewDay, current.programStartDate),
    };
  }, [today]);

  useEffect(() => setWritten({}), [today]);

  const save = useCallback(async () => {
    if (!data) return;
    await reviews.save({
      id: crypto.randomUUID() as ReviewId,
      kind: 'check-in',
      phase: data.profile.phase,
      weekStart: data.week.start,
      weekEnd: data.week.end,
      startedAt: instant(Date.now()),
      completedAt: instant(Date.now()),
      dayAnswers: [],
      answers: written,
      weekNote: note,
    });
    void navigate('/review');
  }, [data, navigate, note, reviews, written]);

  if (!data) return <Empty>Opening the check-in…</Empty>;
  const questions = [...CHECK_IN_QUESTIONS, ...phaseQuestions(data.profile.phase)];

  return (
    <Stack>
      <header>
        <Stack tight>
          <h1>Check-in</h1>
          <div>
            <ChapterTag chapter="Step 1 · Ch. 10" />
          </div>
        </Stack>
      </header>

      <Card>
        <Stack>
          {questions.map((question) => (
            <Field key={question.id} label={question.prompt}>
              <textarea
                value={written[question.id] ?? ''}
                onChange={(event) =>
                  setWritten((current) => ({ ...current, [question.id]: event.target.value }))
                }
              />
            </Field>
          ))}
          <Field label="Anything else">
            <textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Button variant="primary" full onClick={() => void save()}>
            Save check-in
          </Button>
        </Stack>
      </Card>

      <Hint>Check-ins fall every three to four days.</Hint>
    </Stack>
  );
}
