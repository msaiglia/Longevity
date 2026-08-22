CREATE TYPE "public"."article_category" AS ENUM('allenamento', 'nutrizione', 'prevenzione', 'recupero', 'novita');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"category" "article_category" NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"cover_image_url" text,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"author_name" text DEFAULT 'Dott. Carlo Poggioli' NOT NULL,
	"created_by" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;