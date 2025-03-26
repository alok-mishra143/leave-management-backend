import type { Request, Response } from "express";
import { loginValidation } from "../validations/authValidation";
import { db } from "../db/prismaClient";
import jwt from "jsonwebtoken";
import { errorMeassage } from "../constants/Meassage";
import { provider } from "@prisma/client";
const { serverError, userError, statusCodes } = errorMeassage;

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginValidation.safeParse(req.body);
    if (!validation.success) {
      res.status(statusCodes.badRequest).json({
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
        provider: true,
      },
    });

    if (!user) {
      res.status(statusCodes.notFound).json({ error: userError.userNotFound });
      return;
    }
    let passwordMatch = false;

    if (user.provider === provider.credentials && user.password) {
      passwordMatch = await Bun.password.verify(password, user.password);
    }

    if (!passwordMatch) {
      res.status(401).json({ error: userError.invalidPassword });
      return;
    }

    const role = await db.role.findUnique({
      where: { id: user.roleId },
      select: { name: true },
    });

    if (!role) {
      res
        .status(statusCodes.internalServerError)
        .json({ error: userError.userRoleNotFound });
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

    res
      .status(statusCodes.ok)
      .json({ message: userError.loginSucessFull, token });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const logOut = async (req: Request, res: Response): Promise<void> => {
  try {

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const verifyToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.cookies?.token || req.headers?.token;
    if (!token) {
      res
        .status(statusCodes.unauthorized)
        .json({ message: serverError.unauthorized });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res
        .status(statusCodes.internalServerError)
        .json({ error: serverError.internalServerError });
    }
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) {
        res
          .status(statusCodes.unauthorized)
          .json({ message: serverError.unauthorized });
        return;
      }
      res.status(statusCodes.ok).json({ authenticated: true, user: decoded });
    });

    res.status(statusCodes.ok).json({ authenticated: true });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const GetUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res
        .status(statusCodes.unauthorized)
        .json({ message: serverError.unauthorized });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res
        .status(statusCodes.internalServerError)
        .json({ error: serverError.internalServerError });
    }
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) {
        res
          .status(statusCodes.unauthorized)
          .json({ message: serverError.unauthorized });
        return;
      }
      res.status(statusCodes.ok).json({ authenticated: true, user: decoded });
    });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.user!;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        address: true,
        email: true,
        roleId: true,
        image: true,
        name: true,
        phone: true,
        gender: true,
        department: true,

        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      res.status(statusCodes.notFound).json({ error: userError.userNotFound });
      return;
    }

    res.status(statusCodes.ok).json({ user: user });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};
