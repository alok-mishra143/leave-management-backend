import type { Request, Response } from "express";
import {
  loginValidation,
  signUpValidation,
} from "../validations/authValidation";
import { db } from "../db/prismaClient";
import jwt from "jsonwebtoken";

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginValidation.safeParse(req.body);
    if (!validation.success) {
      res
        .status(400)
        .json({ error: "Invalid input", details: validation.error.errors });
      return;
    }
    const { email, password } = validation.data;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, roleId: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    console.log("user", user);

    const passwordMatch = await Bun.password.verify(password, user.password);

    console.log("passwordMatch", passwordMatch);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    const role = await db.role.findUnique({
      where: { id: user.roleId },
      select: { name: true },
    });

    if (!role) {
      res.status(500).json({ error: "User role not found" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: role.name },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86_400_000,
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logOut = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.cookies;
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      res.status(200).json({ authenticated: true, user: decoded.userData });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
