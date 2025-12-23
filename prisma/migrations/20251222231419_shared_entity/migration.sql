/*
  Warnings:

  - You are about to drop the `shared_folders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "shared_folders" DROP CONSTRAINT "shared_folders_folderId_fkey";

-- DropForeignKey
ALTER TABLE "shared_folders" DROP CONSTRAINT "shared_folders_userId_fkey";

-- DropTable
DROP TABLE "shared_folders";

-- CreateTable
CREATE TABLE "shared_entities" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "shareToken" TEXT,
    "shareExpires" TIMESTAMP(3),

    CONSTRAINT "shared_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_entities_shareToken_key" ON "shared_entities"("shareToken");

-- CreateIndex
CREATE INDEX "shared_entities_userId_idx" ON "shared_entities"("userId");

-- CreateIndex
CREATE INDEX "shared_entities_entityId_idx" ON "shared_entities"("entityId");

-- AddForeignKey
ALTER TABLE "shared_entities" ADD CONSTRAINT "shared_entities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_entities" ADD CONSTRAINT "shared_entities_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
