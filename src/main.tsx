import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { RepositoriesProvider } from './app/repositories';
import { db } from './data/db/database';
import { createRepositories } from './data/repositories';
import './ui/theme/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

const repositories = createRepositories(db);

function render(): void {
  createRoot(root as HTMLElement).render(
    <StrictMode>
      <RepositoriesProvider repositories={repositories}>
        <App />
      </RepositoriesProvider>
    </StrictMode>,
  );
}

// Fix the program start date on first run before anything reads it. Rendering
// from the callback rather than awaiting at the top level keeps the bundle
// within the browser baseline, which has no top-level await.
repositories.profile
  .ensure()
  .catch(() => undefined)
  .finally(render);
