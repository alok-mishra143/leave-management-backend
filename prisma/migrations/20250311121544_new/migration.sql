/*
  Warnings:

  - Added the required column `approveBy` to the `LeaveRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "approveBy" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approveBy_fkey" FOREIGN KEY ("approveBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
