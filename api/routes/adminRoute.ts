import express from "express";
import {
  dashboardInfo,
  deleteUser,
  getStudents,
  getUsers,
  signUpUser,
  updateUser,
} from "../controllers/adminController";
import { auth } from "../middleware/auth";
const adminRoute = express.Router();
import { Role } from "../constants/Meassage";

adminRoute.post("/signup", auth([Role.ADMIN]), signUpUser);

adminRoute.patch("/user/:id", auth([Role.ADMIN]), updateUser);

adminRoute.delete("/user/:id", auth([Role.ADMIN]), deleteUser);

adminRoute.post("/users", auth([Role.ADMIN, Role.HOD]), getUsers);

adminRoute.get("/student", auth([Role.ADMIN, Role.STUDENT]), getStudents);
adminRoute.get(
  "/dashboard ",
  auth([Role.ADMIN, Role.STAFF, Role.HOD, Role.STUDENT]),
  dashboardInfo
);

export default adminRoute;
