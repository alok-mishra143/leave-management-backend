import { LeaveStatus } from "@prisma/client";

interface LeaveRequestBody {
  status: LeaveStatus;
}
