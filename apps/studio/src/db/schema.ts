import { integer, pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const themes = pgTable('themes', {
  id: text('id').primaryKey(),
  nom: text('nom').notNull(),
  picto: text('picto').notNull(),
  couleur: text('couleur').notNull(),
  ordre: integer('ordre').notNull().default(0),
})

export const entrees = pgTable('entrees', {
  id: text('id').primaryKey(),
  type: text('type').notNull().default('mot'),
  kabyle: text('kabyle').notNull(),
  kabyleStd: text('kabyle_std'),
  fr: text('fr').notNull(),
  audio: text('audio'),
  variante: text('variante').notNull().default('kabyle-nord'),
  picto: text('picto').notNull(),
  themes: text('themes').array().notNull().default([]),
  niveau: integer('niveau').notNull().default(1),
  pluriel: text('pluriel'),
  contient: text('contient').array().notNull().default([]),
  notes: text('notes').notNull().default(''),
  /** Vrai tant que le locuteur natif n'a pas confirmé la forme. */
  aValider: boolean('a_valider').notNull().default(true),
  /**
   * Position dans le document de corpus. L'ordre y est un choix éditorial —
   * les mots les plus courants d'abord — que l'imagier doit respecter.
   * Sans lui, Postgres rend les lignes dans un ordre arbitraire.
   */
  ordre: integer('ordre').notNull().default(0),
  creeLe: timestamp('cree_le', { withTimezone: true }).notNull().defaultNow(),
})

export const publications = pgTable('publications', {
  version: integer('version').primaryKey(),
  publieLe: timestamp('publie_le', { withTimezone: true }).notNull().defaultNow(),
  nbEntrees: integer('nb_entrees').notNull(),
})

export type LigneEntree = typeof entrees.$inferSelect
export type LigneTheme = typeof themes.$inferSelect
