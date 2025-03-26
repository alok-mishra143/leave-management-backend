import express from "express";
import {
  getUserById,
  GetUserRole,
  loginUser,
  logOut,
  verifyToken,
} from "../controllers/authController";
import { auth } from "../middleware/auth";
import { Role } from "../constants/Meassage";
import passport from "passport";

const authRoute = express.Router();

authRoute.get("/", (req, res) => {
  res.send("Auth route is working");
});

authRoute.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRoute.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.NEXTJS_URL}/login`,
  }),
  (req, res) => {
    const token = (req.user as any)?.token;

    if (token) {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86_400_000,
      });
      res.redirect(`${process.env.NEXTJS_URL}/dashboard`);
    } else {
      res.redirect(`${process.env.NEXTJS_URL}/login`);
    }
  }
);

authRoute.post("/login", loginUser);
authRoute.post("/logout", logOut);
authRoute.post("/verify", verifyToken);
authRoute.post("/me", GetUserRole);
authRoute.get(
  "/whoami",
  auth([Role.ADMIN, Role.HOD, Role.STAFF, Role.STUDENT]),
  getUserById
);

export default authRoute;
