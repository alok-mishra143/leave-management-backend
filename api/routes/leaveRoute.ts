import { Router } from "express";
import {
  applyLeave,
  deleteLeave,
  EditLeave,
  getAllApprovedLeaves,
  getLeaveBalance,
  getPersonalLeave,
  getTeacherForLeave,
  updateLeaveStatus,
  viewLeaves,
} from "../controllers/leaveControllers";
import { auth } from "../middleware/auth";
import { Role } from "../constants/Meassage";

const leaveRouter = Router();

leaveRouter.get(
  "/leaves",
  auth([Role.ADMIN, Role.HOD, Role.STAFF]),
  viewLeaves
);
leaveRouter.get(
  "/personal-leaves/:id",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF, Role.HOD]),
  getPersonalLeave
);

leaveRouter.get(
  "/leaves-balance/:id",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF]),
  getLeaveBalance
);

leaveRouter.get(
  "/staff/:department",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF]),
  getTeacherForLeave
);
leaveRouter.get(
  "/dashboard",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF, Role.HOD]),
  getAllApprovedLeaves
);

leaveRouter.patch(
  "/leave/:id",
  auth([Role.ADMIN, Role.STAFF, Role.HOD]),
  updateLeaveStatus
);

leaveRouter.patch(
  "/edit-leave/:id",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF]),
  EditLeave
);

leaveRouter.post(
  "/apply-leave",
  auth([Role.STUDENT, Role.ADMIN, Role.HOD, Role.STAFF]),
  applyLeave
);

leaveRouter.delete(
  "/delete-leave/:id",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF]),
  deleteLeave
);

export default leaveRouter;
