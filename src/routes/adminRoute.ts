import express from "express";
import { signUpUser, updateLeaveStatus } from "../controllers/adminController";
const adminRoute = express.Router();

adminRoute.post("/signup", signUpUser);

adminRoute.patch("/leave/:id", updateLeaveStatus);

export default adminRoute;
