/*
  Warnings:

  - You are about to drop the column `requestedTo` on the `LeaveRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LeaveRequest" DROP COLUMN "requestedTo",
ADD COLUMN     "requestTo" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_requestTo_fkey" FOREIGN KEY ("requestTo") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
