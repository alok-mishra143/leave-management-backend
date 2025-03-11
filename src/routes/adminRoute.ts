import express from "express";
import { signUpUser } from "../controllers/adminController";
const adminRoute = express.Router();

adminRoute.post("/signup", signUpUser);

export default adminRoute;
