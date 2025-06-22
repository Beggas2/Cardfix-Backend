-- AlterTable
ALTER TABLE "contest_topics" ADD COLUMN "priority" INTEGER;

-- AlterTable
ALTER TABLE "subtopics" ADD COLUMN "estimatedCards" INTEGER;
ALTER TABLE "subtopics" ADD COLUMN "priority" INTEGER;

-- AlterTable
ALTER TABLE "topics" ADD COLUMN "priority" INTEGER;

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "subtopicId" TEXT,
    "reviewTime" DATETIME NOT NULL,
    "easeFactor" REAL NOT NULL,
    "interval" INTEGER NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "study_sessions_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "study_sessions_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "study_sessions_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "subtopics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
