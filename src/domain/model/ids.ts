import type { Branded } from './brand';

export type EpisodeId = Branded<string, 'EpisodeId'>;
export type PlannedItemId = Branded<string, 'PlannedItemId'>;
export type ReviewId = Branded<string, 'ReviewId'>;
export type TemplateId = Branded<string, 'TemplateId'>;

/** Identifiers are opaque; the caller supplies the generator so the domain stays pure. */
export type IdFactory = () => string;

export function newId<T extends string>(create: IdFactory): Branded<string, T> {
  return create() as Branded<string, T>;
}
