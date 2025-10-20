-- CreateEnum
CREATE TYPE "StreamType" AS ENUM ('CANAL', 'FILME', 'SERIE');

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Stream" ADD COLUMN     "streamType" "StreamType" NOT NULL DEFAULT 'CANAL';
