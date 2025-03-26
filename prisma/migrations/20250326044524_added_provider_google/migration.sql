-- CreateEnum
CREATE TYPE "provider" AS ENUM ('google', 'credentials');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" "provider" NOT NULL DEFAULT 'credentials',
ALTER COLUMN "password" DROP NOT NULL;
