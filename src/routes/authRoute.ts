import express from "express";
import { loginUser, logOut, verifyToken } from "../controllers/authController";

const authRoute = express.Router();

authRoute.get("/", (req, res) => {
  res.send("Auth route is working");
});

authRoute.post("/login", loginUser);
authRoute.post("/logout", logOut);
authRoute.post("/verify", verifyToken);

export default authRoute;
