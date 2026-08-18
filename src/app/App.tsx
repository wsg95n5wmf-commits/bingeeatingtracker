import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import { AppShell } from '@/ui/components/AppShell';
import { TodayScreen } from '@/ui/screens/today/TodayScreen';
import { RecordScreen } from '@/ui/screens/record/RecordScreen';
import { PlanScreen } from '@/ui/screens/plan/PlanScreen';
import { WeighingScreen } from '@/ui/screens/weighing/WeighingScreen';
import { ReviewHubScreen } from '@/ui/screens/review/ReviewHubScreen';
import { WeeklyReviewScreen } from '@/ui/screens/review/WeeklyReviewScreen';
import { CheckInScreen } from '@/ui/screens/review/CheckInScreen';
import { SummaryScreen } from '@/ui/screens/summary/SummaryScreen';
import { SettingsScreen } from '@/ui/screens/settings/SettingsScreen';
import { SafetyScreen } from '@/ui/screens/safety/SafetyScreen';

/**
 * Hash routing keeps deep links working when the app is served from a
 * subdirectory on static hosting, and when it is opened from the home screen.
 */
export function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayScreen />} />
          <Route path="record" element={<RecordScreen />} />
          <Route path="record/:date" element={<RecordScreen />} />
          <Route path="plan" element={<PlanScreen />} />
          <Route path="plan/:date" element={<PlanScreen />} />
          <Route path="weight" element={<WeighingScreen />} />
          <Route path="review" element={<ReviewHubScreen />} />
          <Route path="review/check-in" element={<CheckInScreen />} />
          <Route path="review/weekly/:weekStart" element={<WeeklyReviewScreen />} />
          <Route path="summary" element={<SummaryScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="help" element={<SafetyScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
