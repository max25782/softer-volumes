-- Lock Prisma tables away from the Supabase Data API (PostgREST).
--
-- These tables live in the exposed `public` schema and were created without
-- RLS. On Supabase projects that still auto-GRANT to `anon`/`authenticated`
-- (projects created before 2026-05-30, and existing projects until 2026-10-30),
-- anyone who extracts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from the client
-- bundle can read paid Place content, User PII, Purchase rows, and OAuth
-- tokens stored on Account.
--
-- Prisma is unaffected: DATABASE_URL connects as `postgres`, which bypasses
-- RLS and is not subject to the anon/authenticated revokes.
-- Roles are revoked only when they exist so this migration is safe on
-- non-Supabase Postgres.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE
      "Account",
      "Session",
      "VerificationToken",
      "User",
      "Guide",
      "Place",
      "PlacePhoto",
      "Purchase",
      "GuideRating",
      "GuideComment",
      "PromoCode"
    FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE
      "Account",
      "Session",
      "VerificationToken",
      "User",
      "Guide",
      "Place",
      "PlacePhoto",
      "Purchase",
      "GuideRating",
      "GuideComment",
      "PromoCode"
    FROM authenticated;
  END IF;
END $$;

ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Guide" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Place" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlacePhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Purchase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuideRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuideComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromoCode" ENABLE ROW LEVEL SECURITY;
