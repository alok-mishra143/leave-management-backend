import express from "express";
import { loginUser, logOut } from "../controllers/authController";

const authRoute = express.Router();

authRoute.get("/", (req, res) => {
  res.send("Auth route is working");
});

authRoute.post("/login", loginUser);
authRoute.post("/logout", logOut);

export default authRoute;
