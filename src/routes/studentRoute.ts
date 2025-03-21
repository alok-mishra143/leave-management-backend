import express from "express";
import {
  applyLeave,
  deleteLeave,
  EditLeave,
  getAllApprovedLeaves,
  getLeaveBalance,
  getPersonalLeave,
  getTeacherForLeave,
  registerStudent,
  updateProfile,
} from "../controllers/studentController";
import { auth } from "../middleware/auth";
import { Role } from "../constants/Meassage";
const studentRoute = express.Router();

studentRoute.post("/register", registerStudent);
studentRoute.post(
  "/apply-leave/:id",
  auth([Role.STUDENT, Role.ADMIN, Role.HOD, Role.STAFF]),
  applyLeave
);
studentRoute.patch(
  "/edit-leave/:id",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF]),
  EditLeave
);
studentRoute.patch(
  "/update-profile",
  auth([Role.STUDENT, Role.ADMIN, Role.HOD, Role.STAFF]),
  updateProfile
);

studentRoute.delete(
  "/delete-leave/:id",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF]),
  deleteLeave
);

studentRoute.get(
  "/staff/:department",
  auth([Role.STUDENT, Role.ADMIN]),
  getTeacherForLeave
);
studentRoute.get(
  "/personal-leaves/:id",
  auth([Role.STUDENT, Role.ADMIN]),
  getPersonalLeave
);
studentRoute.get(
  "/leaves-balance/:id",
  auth([Role.STUDENT, Role.ADMIN]),
  getLeaveBalance
);

studentRoute.get(
  "/dashboard",
  auth([Role.STUDENT, Role.ADMIN, Role.STAFF, Role.HOD]),
  getAllApprovedLeaves
);

export default studentRoute;
