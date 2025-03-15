import express from "express";
import { applyLeave, registerStudent } from "../controllers/studentController";
const studentRoute = express.Router();

studentRoute.post("/register", registerStudent);
studentRoute.post("/apply-leave/:id", applyLeave);
export default studentRoute;
