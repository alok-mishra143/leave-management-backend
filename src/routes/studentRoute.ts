import express from "express";
import {
  registerStudent,
  updateProfile,
} from "../controllers/studentController";
import { auth } from "../middleware/auth";
import { Role } from "../constants/Meassage";
const studentRoute = express.Router();

studentRoute.post("/register", registerStudent);

studentRoute.patch(
  "/update-profile",
  auth([Role.STUDENT, Role.ADMIN, Role.HOD, Role.STAFF]),
  updateProfile
);

export default studentRoute;
