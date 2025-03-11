import jwt from "jsonwebtoken";
import { db } from "../db/prismaClient";
import { LeaveStatus } from "@prisma/client";
import {
  signUpValidation,
  updateUserValidation,
} from "../validations/authValidation";
import type { Request, Response } from "express";
import { errorMeassage } from "../constants/Meassage";

const { serverError, userError } = errorMeassage;

export const signUpUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.cookies;
    if (!token) {
      res.status(401).json({ error: serverError.tokenNotFound });
      return;
    }

    const userrole = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };

    if (!userrole) {
      res.status(401).json({ error: serverError.unauthorized });
      return;
    }

    if (userrole.role !== "ADMIN") {
      res.status(401).json({ error: serverError.unauthorized });
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
      res.status(400).json({ error: userError.userExists });
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

    const createLeaveTable = await db.userLeaveTable.create({
      data: {
        userId: newUser.id,
        academicYear: new Date().getFullYear().toString(),
      },
    });

    res.status(201).json({ message: userError.userCreated, user: newUser });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.cookies;
    if (!token) {
      res.status(401).json({ error: serverError.tokenNotFound });
      return;
    }

    const userrole = jwt.verify(token, process.env.JWT_SECRET!);

    if (userrole !== "ADMIN") {
      res.status(401).json({ error: serverError.unauthorized });
      return;
    }

    const validation = updateUserValidation.safeParse(req.body);

    const { id } = req.params;

    if (!validation.success) {
      res.status(400).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { email, address, department, gender, image, name, phone, role } =
      validation.data;

    const updateUser = await db.user.update({
      where: { id: id },
      data: {
        email,
        address,
        department,
        name,
        gender,
        image,
        phone: phone.toString(),
        role: {
          connect: {
            id: role,
          },
        },
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.cookies;
    if (!token) {
      res.status(401).json({ error: serverError.tokenNotFound });
      return;
    }

    const userrole = jwt.verify(token, process.env.JWT_SECRET!);

    if (userrole !== "ADMIN") {
      res.status(401).json({ error: serverError.unauthorized });
      return;
    }

    const { id } = req.params;

    const deleteUser = await db.user.delete({
      where: { id: id },
    });

    res.status(200).json({ message: "User deleted", user: deleteUser });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract and verify token
    const { token } = req.cookies;
    if (!token) {
      res.status(401).json({ error: serverError.tokenNotFound });
      return;
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };
    if (decodedToken.role !== "ADMIN") {
      res.status(403).json({ error: serverError.unauthorized });
      return;
    }

    // Extract query parameters with default values
    const roleID = req.query.roleID as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    // Validate pagination values
    if (limit < 1 || page < 1) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    // Fetch users with optional role filtering and pagination
    const users = await db.user.findMany({
      where: roleID ? { role: { id: roleID } } : {}, // Filter by role if provided
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
        department: true,
        phone: true,
      },
    });

    // Count total users for pagination metadata
    const totalUsers = await db.user.count({
      where: roleID ? { role: { id: roleID } } : {},
    });

    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const viewLeaves = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract and validate token
    const { token } = req.cookies;
    if (!token) {
      res.status(401).json({ error: serverError.tokenNotFound });
      return;
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };

    if (!decodedToken || decodedToken.role !== "ADMIN") {
      res.status(403).json({ error: serverError.unauthorized });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as LeaveStatus | undefined;

    // Fetch leaves with pagination
    // Fetch leaves with pagination
    const [leaves, total] = await Promise.all([
      db.leaveRequest.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: status ? { status } : {},
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          startDate: true,
          endDate: true,
          status: true,
          reason: true,
        },
      }),
      db.leaveRequest.count({ where: status ? { status } : {} }),
    ]);

    // Return response with pagination info
    res.status(200).json({
      success: true,
      data: leaves,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const updateLeaveStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract and validate token
    const { token } = req.cookies;
    if (!token) {
      res.status(401).json({ error: serverError.tokenNotFound });
      return;
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
      id: string;
    };

    if (!decodedToken || !["ADMIN", "TEACHER"].includes(decodedToken.role)) {
      res.status(403).json({ error: serverError.unauthorized });
      return;
    }

    // Extract leaveId and status from request
    const { leaveId } = req.params;
    const { status } = req.body;

    // Validate leave ID
    if (!leaveId) {
      res.status(400).json({ error: "Leave ID is required" });
      return;
    }

    // Validate status (Ensure it's a valid enum value)
    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      res.status(400).json({ error: "Invalid leave status" });
      return;
    }

    // Find existing leave request
    const existingLeave = await db.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!existingLeave) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    // Update leave status
    const updatedLeave = await db.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        approveBy: decodedToken.id,
      },
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Leave status updated successfully",
      data: updatedLeave,
    });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};
