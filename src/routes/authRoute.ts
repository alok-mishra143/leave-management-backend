import express from "express";
import {
  getUserById,
  GetUserRole,
  loginUser,
  logOut,
  verifyToken,
} from "../controllers/authController";

const authRoute = express.Router();

authRoute.get("/", (req, res) => {
  res.send("Auth route is working");
});

authRoute.post("/login", loginUser);
authRoute.post("/logout", logOut);
authRoute.post("/verify", verifyToken);
authRoute.post("/me", GetUserRole);
authRoute.get("/whoami", getUserById);

export default authRoute;
