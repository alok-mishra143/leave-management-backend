import express from "express";
import {
  applyLeave,
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
studentRoute.post("/apply-leave/:id", auth([Role.STUDENT]), applyLeave);
studentRoute.patch(
  "/update-profile",
  auth([Role.STUDENT, Role.ADMIN, Role.HOD, Role.STAFF]),
  updateProfile
);

studentRoute.get("/saff/:department", auth([Role.STUDENT]), getTeacherForLeave);
studentRoute.get("leaves/request", auth([Role.STUDENT]), getPersonalLeave);
studentRoute.get("leaves/balance", auth([Role.STUDENT]), getLeaveBalance);
export default studentRoute;
