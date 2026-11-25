CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Content_searchText_trgm_idx"
ON "Content" USING GIN ("searchText" gin_trgm_ops);

CREATE UNIQUE INDEX "Content_unique_kanji"
ON "Content" (title) WHERE kind = 'KANJI';

ALTER TABLE "Content"
ADD CONSTRAINT "Content_difficulty_range" CHECK ("difficulty" BETWEEN 1 AND 5),
ADD CONSTRAINT "Content_strokes_range" CHECK ("strokes" IS NULL OR "strokes" BETWEEN 1 AND 80);

ALTER TABLE "Question"
ADD CONSTRAINT "Question_difficulty_range" CHECK ("difficulty" BETWEEN 1 AND 5),
ADD CONSTRAINT "Question_has_answers" CHECK (cardinality("answers") > 0);

ALTER TABLE "User"
ADD CONSTRAINT "User_daily_minutes_range" CHECK ("dailyMinutes" BETWEEN 5 AND 180);

ALTER TABLE "Review"
ADD CONSTRAINT "Review_schedule_valid" CHECK ("interval" >= 0 AND "count" >= "streak" AND "streak" >= 0);

ALTER TABLE "Attempt"
ADD CONSTRAINT "Attempt_scoring_valid" CHECK (
  ("submittedAt" IS NULL AND "correct" IS NULL) OR
  ("submittedAt" IS NOT NULL AND "correct" IS NOT NULL AND "correct" >= 0)
);

ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_seconds_valid" CHECK ("seconds" BETWEEN 0 AND 10800);

