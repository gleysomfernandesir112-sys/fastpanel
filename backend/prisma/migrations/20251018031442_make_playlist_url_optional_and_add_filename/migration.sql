-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "fileName" TEXT,
ALTER COLUMN "url" DROP NOT NULL;
