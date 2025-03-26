import { db } from "../db/prismaClient";
import { errorMeassage, Role } from "../constants/Meassage";
import type { Request, Response } from "express";
import {
  studentSignupValidation,
  studentUpdateValidation,
} from "../validations/authValidation";

const { serverError, userError, statusCodes } = errorMeassage;

export const registerStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = studentSignupValidation.safeParse(req.body);
    if (!validation.success) {
      res.status(statusCodes.badRequest).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { address, department, email, gender, name, password, phone } =
      validation.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(statusCodes.badRequest).json({ error: userError.userExists });
      return;
    }

    const hash = await Bun.password.hash(password);

    const student = await db.user.create({
      data: {
        address,
        department,
        email,
        gender,
        image: `https://avatar.vercel.sh/${name[0]}`,
        name,
        password: hash,
        phone: phone.toString(),
        role: {
          connect: {
            id: Role.STUDENT,
          },
        },
      },
    });

    const createdUserLeave = await db.userLeaveTable.create({
      data: {
        userId: student.id,
        academicYear: new Date().getFullYear().toString(),
      },
    });

    res.status(statusCodes.created).json({
      message: userError.studentCreated,
      student: student,
      userLeave: createdUserLeave,
    });
  } catch (error) {
    console.log(error);
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = studentUpdateValidation.safeParse(req.body);
    const { id } = req.user;

    if (!validation.success) {
      res.status(statusCodes.badRequest).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { name, gender, address, phone } = validation.data;

    const updatedProfile = await db.user.update({
      where: { id },
      data: {
        name,
        address,
        gender,
        phone,
      },
    });

    res.status(statusCodes.ok).json({
      message: userError.userUpdated,
    });
  } catch (error) {
    console.log(error);
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};
