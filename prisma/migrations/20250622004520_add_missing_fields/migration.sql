-- AlterTable
ALTER TABLE "cards" ADD COLUMN "isReused" BOOLEAN;

-- AlterTable
ALTER TABLE "contest_topics" ADD COLUMN "priority" INTEGER;

-- AlterTable
ALTER TABLE "contests" ADD COLUMN "institution" TEXT;
ALTER TABLE "contests" ADD COLUMN "position" TEXT;

-- AlterTable
ALTER TABLE "subtopics" ADD COLUMN "priority" INTEGER;

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudySession_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
