import { Link } from 'react-router-dom';
import { WEEKDAY_NAMES, type Weekday } from '@/domain/model/date';
import { PHASES } from '@/domain/model/phase';
import type { HeightUnit, WeightUnit } from '@/domain/model/units';
import { environmentLabel, isBeta } from '@/app/environment';
import { Button, Card, Empty, Field, Hint, Stack } from '@/ui/components/ui';
import { useSettingsViewModel } from './useSettingsViewModel';
import styles from './settings.module.css';

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export function SettingsScreen() {
  const vm = useSettingsViewModel();
  if (!vm.profile) return <Empty>Opening settings…</Empty>;
  const profile = vm.profile;

  return (
    <Stack>
      <h1>Settings</h1>

      <Card>
        <Stack tight>
          <h2>Where you are in the program</h2>
          <div className={styles.phases}>
            {PHASES.map((phase) => (
              <button
                key={phase.id}
                type="button"
                disabled={!phase.available}
                className={`${styles.phase} ${profile.phase === phase.id ? styles.phaseOn : ''}`}
                onClick={() => vm.setPhase(phase.id)}
              >
                <span>{phase.label}</span>
                <span className={styles.phaseChapter}>
                  {phase.chapter}
                  {phase.available ? '' : ' · not built yet'}
                </span>
              </button>
            ))}
          </div>
          <Hint>Steps 1 and 2 are built. The rest are listed so the shape of the program is visible.</Hint>
        </Stack>
      </Card>

      <Card>
        <Stack>
          <h2>Days</h2>
          <Field label="Weigh day" hint="One reading a week, on this day.">
            <select
              value={profile.weighDay}
              onChange={(event) => vm.setWeighDay(Number(event.target.value) as Weekday)}
            >
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {WEEKDAY_NAMES[day]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Review day" hint="The program week runs from this day to this day.">
            <select
              value={profile.reviewDay}
              onChange={(event) => vm.setReviewDay(Number(event.target.value) as Weekday)}
            >
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {WEEKDAY_NAMES[day]}
                </option>
              ))}
            </select>
          </Field>
        </Stack>
      </Card>

      <Card>
        <Stack>
          <h2>Units</h2>
          <Field label="Weight">
            <select
              value={profile.weightUnit}
              onChange={(event) => vm.setWeightUnit(event.target.value as WeightUnit)}
            >
              <option value="kg">Kilograms</option>
              <option value="lb">Pounds</option>
            </select>
          </Field>
          <Field label="Height">
            <select
              value={profile.heightUnit}
              onChange={(event) => vm.setHeightUnit(event.target.value as HeightUnit)}
            >
              <option value="cm">Centimetres</option>
              <option value="ftin">Feet and inches</option>
            </select>
          </Field>
          <Hint>Changing units only changes what you see. Your readings are stored unchanged.</Hint>
        </Stack>
      </Card>

      <Card>
        <Stack>
          <h2>Your data</h2>
          {isBeta ? (
            <Hint>These records are kept separately and the live app cannot see them.</Hint>
          ) : null}
          <Hint>
            Everything is stored on this device only. Browsers can clear their storage, so keep a
            backup somewhere you trust.
          </Hint>
          {vm.storage === 'persistent' ? (
            <Hint>Storage is marked persistent on this device.</Hint>
          ) : vm.storage === 'best-effort' ? (
            <Hint>
              Storage is not marked persistent here, so the browser may clear it under pressure.
              Adding the app to your home screen makes this more likely to be granted.
            </Hint>
          ) : null}
          <Button full onClick={() => void vm.exportData()}>
            Export a backup
          </Button>
          <Button full onClick={() => vm.fileInput.current?.click()}>
            Restore from a backup
          </Button>
          <input
            ref={vm.fileInput}
            type="file"
            accept="application/json,.json"
            className={styles.hiddenInput}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void vm.importData(file);
              event.target.value = '';
            }}
          />
          {vm.message ? <Hint>{vm.message}</Hint> : null}
        </Stack>
      </Card>

      <Card>
        <Stack>
          <h2>Version</h2>
          <Hint>
            Build: <strong>{environmentLabel}</strong>, {new Date(vm.buildTime).toLocaleString()}
          </Hint>
          <Button full onClick={() => void vm.lookForUpdate()}>
            Check for updates
          </Button>
          <Hint>
            The app looks for a new version whenever you open it. Updates are never applied while
            you are in the middle of something — you are asked first.
          </Hint>
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <h2>Help</h2>
          <Link to="/help">Getting help</Link>
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <h2>Erase everything</h2>
          <Hint>Deletes every record on this device. This cannot be undone.</Hint>
          <Button
            variant="danger"
            full
            onClick={() => {
              if (window.confirm('Delete every record on this device? This cannot be undone.')) {
                vm.eraseEverything();
              }
            }}
          >
            Erase all data
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
