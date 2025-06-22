/*
  Warnings:

  - You are about to drop the `StudySession` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "subtopics" ADD COLUMN "estimatedCards" INTEGER;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StudySession";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewDate" DATETIME,
    "easeFactor" REAL,
    CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "study_sessions_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
