import { LeaveStatus, LeaveType } from "@prisma/client";
import z from "zod";

export const userLeaveValidationSchema = z.object({
  requestedTo: z.string().min(1, "Requested-to field is required"),
  approveBy: z.string().optional(),
  startDate: z.string({ required_error: "Start date is required" }),
  endDate: z.string({ required_error: "End date is required" }),
  status: z.nativeEnum(LeaveStatus, {
    errorMap: () => ({ message: "Invalid leave status" }),
  }),
  leaveType: z.nativeEnum(LeaveType, {
    errorMap: () => ({ message: "Invalid leave type" }),
  }),
  reason: z.string().min(5, "Reason must be at least 5 characters long"),
});
//   .superRefine((data, ctx) => {
//     if (data.endDate < data.startDate) {
//       ctx.addIssue({
//         path: ["endDate"],
//         message: "End date must be after or equal to start date",
//         code: "custom",
//       });
//     }
//   });

export const applyLeaveValidation = userLeaveValidationSchema.pick({
  requestedTo: true,
  startDate: true,
  endDate: true,
  leaveType: true,
  reason: true,
});
