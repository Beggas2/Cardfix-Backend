/*
  Warnings:

  - Added the required column `quality` to the `study_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_study_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "subtopicId" TEXT,
    "reviewTime" DATETIME NOT NULL,
    "quality" INTEGER NOT NULL,
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
INSERT INTO "new_study_sessions" ("cardId", "contestId", "correct", "createdAt", "easeFactor", "id", "interval", "repetitions", "reviewTime", "subtopicId", "userId") SELECT "cardId", "contestId", "correct", "createdAt", "easeFactor", "id", "interval", "repetitions", "reviewTime", "subtopicId", "userId" FROM "study_sessions";
DROP TABLE "study_sessions";
ALTER TABLE "new_study_sessions" RENAME TO "study_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
