import type { Request, Response } from "express";
import {
  loginValidation,
  signUpValidation,
} from "../validations/authValidation";
import { db } from "../db/prismaClient";
import jwt from "jsonwebtoken";
import { errorMeassage } from "../constants/Meassage";
const { serverError, userError } = errorMeassage;

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginValidation.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }
    const { email, password } = validation.data;

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        roleId: true,
        image: true,
        name: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: userError.userNotFound });
      return;
    }

    const passwordMatch = await Bun.password.verify(password, user.password);

    console.log("passwordMatch", passwordMatch);
    if (!passwordMatch) {
      res.status(401).json({ error: userError.invalidPassword });
      return;
    }

    const role = await db.role.findUnique({
      where: { id: user.roleId },
      select: { name: true },
    });

    if (!role) {
      res.status(500).json({ error: userError.userRoleNotFound });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: role.name,
        roleId: user.roleId,
        image: user.image,
        name: user.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86_400_000,
    });

    res.status(200).json({ message: userError.loginSucessFull, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const logOut = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: userError.logoutSucessFull });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies?.token || req.headers?.token;
    if (!token) {
      res.status(401).json({ message: serverError.unauthorized });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: serverError.internalServerError });
    }
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ message: serverError.unauthorized });
        return;
      }
      res.status(200).json({ authenticated: true, user: decoded });
    });

    res.status(200).json({ authenticated: true });
  } catch (error) {
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const GetUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(401).json({ message: serverError.unauthorized });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: serverError.internalServerError });
    }
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ message: serverError.unauthorized });
        return;
      }
      res.status(200).json({ authenticated: true, user: decoded });
    });
  } catch (error) {
    res.status(500).json({ error: serverError.internalServerError });
  }
};
