-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subtopicId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "createdBy" TEXT NOT NULL,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cards_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "subtopics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_cards" ("back", "createdAt", "createdBy", "easeFactor", "front", "id", "interval", "repetitions", "subtopicId", "updatedAt") SELECT "back", "createdAt", "createdBy", "easeFactor", "front", "id", "interval", "repetitions", "subtopicId", "updatedAt" FROM "cards";
DROP TABLE "cards";
ALTER TABLE "new_cards" RENAME TO "cards";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
