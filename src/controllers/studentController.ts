import { db } from "../db/prismaClient";
import { Department } from "@prisma/client";
import { errorMeassage } from "../constants/Meassage";
import type { Request, Response } from "express";
import {
  studentSignupValidation,
  studentUpdateValidation,
} from "../validations/authValidation";
import {
  applyLeaveValidation,
  userLeaveValidationSchema,
} from "../validations/leaveValidation";

const { serverError, userError } = errorMeassage;

export const registerStudent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = studentSignupValidation.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { address, department, email, gender, image, name, password, phone } =
      validation.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: userError.userExists });
      return;
    }

    const hash = await Bun.password.hash(password);

    const student = await db.user.create({
      data: {
        address,
        department,
        email,
        gender,
        image,
        name,
        password: hash,
        phone: phone.toString(),
        role: {
          connect: {
            id: "3",
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

    res.status(201).json({
      message: "Student created successfully",
      student: student,
      userLeave: createdUserLeave,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = studentUpdateValidation.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { address, department, email, gender, image, name, phone } =
      validation.data;

    const student = await db.user.update({
      where: { email },
      data: {
        address,
        department,
        gender,
        image,
        name,
        phone: phone.toString(),
      },
    });

    res.status(200).json({ message: "Student updated successfully", student });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const applyLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: userError.invalidInput });
      return;
    }

    const validation = applyLeaveValidation.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { endDate, leaveType, reason, requestedTo, startDate, status } =
      validation.data;

    const leave = await db.leaveRequest.create({
      data: {
        endDate,
        leaveType,
        reason,
        requestedTo,
        startDate,
        status,
        userId: id,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const getLeaveByDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { department } = req.params;

    if (
      !department ||
      !Object.values(Department).includes(department as Department)
    ) {
      res.status(400).json({ error: userError.invalidInput });
      return;
    }

    const leave = await db.leaveRequest.findMany({
      where: {
        user: {
          department: department as Department,
        },
      },
    });

    res.status(200).json({ leave });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const getPersonalLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: userError.invalidInput });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [leave, total] = await Promise.all([
      db.leaveRequest.findMany({
        where: { userId: id },
        take: limit,
        skip: skip,
        orderBy: { createdAt: "desc" },
      }),
      db.leaveRequest.count({ where: { userId: id } }),
    ]);

    res.status(200).json({
      success: true,
      data: leave,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const getLeaveBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: userError.invalidInput });
      return;
    }

    const userLeave = await db.userLeaveTable.findUnique({
      where: { userId: id },
    });

    res.status(200).json({ userLeave });
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const getTeacherForLeave = async (
  req: Request,
  res: Response
): Promise<void> => {};
