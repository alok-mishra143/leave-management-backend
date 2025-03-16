/*
  Warnings:

  - Added the required column `leaveType` to the `LeaveRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('HALF_DAY', 'FULL_DAY');

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "leaveType" "LeaveType" NOT NULL;
