declare const brand: unique symbol;

/** A nominal type: `Branded<string, 'EpisodeId'>` is not assignable from a bare string. */
export type Branded<T, B extends string> = T & { readonly [brand]: B };
