CREATE TABLE IF NOT EXISTS "entrees" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'mot' NOT NULL,
	"kabyle" text NOT NULL,
	"kabyle_std" text,
	"fr" text NOT NULL,
	"audio" text,
	"variante" text DEFAULT 'kabyle-nord' NOT NULL,
	"picto" text NOT NULL,
	"themes" text[] DEFAULT '{}' NOT NULL,
	"niveau" integer DEFAULT 1 NOT NULL,
	"pluriel" text,
	"contient" text[] DEFAULT '{}' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"a_valider" boolean DEFAULT true NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "publications" (
	"version" integer PRIMARY KEY NOT NULL,
	"publie_le" timestamp with time zone DEFAULT now() NOT NULL,
	"nb_entrees" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "themes" (
	"id" text PRIMARY KEY NOT NULL,
	"nom" text NOT NULL,
	"picto" text NOT NULL,
	"couleur" text NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL
);
