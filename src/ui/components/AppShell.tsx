import { NavLink, Outlet } from 'react-router-dom';
import { isBeta } from '@/app/environment';
import styles from './AppShell.module.css';

const TABS = [
  { to: '/', label: 'Today', glyph: '◔', end: true },
  { to: '/record', label: 'Record', glyph: '▤', end: false },
  { to: '/weight', label: 'Weight', glyph: '◇', end: false },
  { to: '/review', label: 'Review', glyph: '◉', end: false },
  { to: '/settings', label: 'Settings', glyph: '⚙', end: false },
] as const;

export function AppShell() {
  return (
    <div className={styles.shell}>
      {isBeta ? (
        <p className={styles.betaBar}>
          Beta — separate records from the live app
        </p>
      ) : null}
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.nav}>
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={styles.tab ?? ''}>
            <span className={styles.glyph} aria-hidden="true">
              {tab.glyph}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
