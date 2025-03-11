import jwt from "jsonwebtoken";
import { db } from "../db/prismaClient";
import { signUpValidation } from "../validations/authValidation";
import type { Request, Response } from "express";

export const signUpUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.cookies;
    if (!token) {
      res.status(401).json({ error: "Token Not Found" });
      return;
    }

    const userrole = jwt.verify(token, process.env.JWT_SECRET!);

    if (userrole !== "ADMIN") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const validation = signUpValidation.safeParse(req.body);
    if (!validation.success) {
      res
        .status(400)
        .json({ error: "Invalid input", details: validation.error.errors });
      return;
    }

    const {
      email,
      gender,
      name,
      password,
      role,
      address,
      image,
      phone,
      department,
    } = validation.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await Bun.password.hash(password);

    const newUser = await db.user.create({
      data: {
        email,
        gender: gender === "MALE" ? "MALE" : "FEMALE",
        name,
        password: hashedPassword,
        role: {
          connect: {
            id: role,
          },
        },
        department: department,
        address,
        image,
        phone: phone.toString(),
      },
    });

    res.status(201).json({ message: "User created", user: newUser });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
