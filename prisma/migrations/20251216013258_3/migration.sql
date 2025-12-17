-- DropForeignKey
ALTER TABLE "entities" DROP CONSTRAINT "entities_userId_fkey";

-- DropForeignKey
ALTER TABLE "shared_folders" DROP CONSTRAINT "shared_folders_userId_fkey";

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_folders" ADD CONSTRAINT "shared_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
