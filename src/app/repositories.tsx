import { createContext, useContext, type ReactNode } from 'react';
import type { Repositories } from '@/domain/repositories';

const RepositoriesContext = createContext<Repositories | undefined>(undefined);

export function RepositoriesProvider({
  repositories,
  children,
}: {
  repositories: Repositories;
  children: ReactNode;
}) {
  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  );
}

/** The only way the UI reaches the data layer. */
export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) throw new Error('RepositoriesProvider is missing from the tree.');
  return repositories;
}
