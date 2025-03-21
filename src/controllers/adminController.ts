import jwt from "jsonwebtoken";
import { db } from "../db/prismaClient";
import { LeaveStatus, Prisma } from "@prisma/client";
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
      roleId,
      address,
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
        gender: gender,
        name,
        password: hashedPassword,
        role: {
          connect: {
            id: roleId,
          },
        },
        department: department,
        address,
        image: `https://avatar.vercel.sh/${name[0]}`,
        phone: phone.toString(),
      },
    });

    const createLeaveTable = await db.userLeaveTable.create({
      data: {
        userId: newUser.id,
        academicYear: new Date().getFullYear().toString(),
      },
    });

    res.status(201).json({
      message: userError.userCreated,
      user: newUser,
      leaveTable: createLeaveTable,
    });
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
    const validation = updateUserValidation.safeParse(req.body);

    const { id } = req.params;

    if (!validation.success) {
      res.status(400).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { email, address, department, gender, name, phone, roleId } =
      validation.data;

    const updateUser = await db.user.update({
      where: { id: id },
      data: {
        email,
        address,
        department,
        name,
        gender,
        phone: phone,
        role: {
          connect: {
            id: roleId,
          },
        },
      },
    });
    res.status(200).json({ message: "User updated", user: updateUser });
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
    // Extract query parameters with default values
    const roleID = req.query.roleID as string | "";
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const sort = req.query.sort as string | "asc";
    const col = req.query.col as string | "name";
    const search = req.query.search as string | "";

    // Validate pagination values
    if (limit < 1 || page < 1) {
      res.status(400).json({ error: "Invalid pagination parameters" });
      return;
    }

    const roleFilter = roleID && roleID !== "All" ? { roleId: roleID } : {};
    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
            {
              address: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
          ],
        }
      : {};

    // Fetch users with optional role filtering and pagination
    const users = await db.user.findMany({
      where: {
        ...roleFilter,
        ...searchFilter,
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy:
        col === "role"
          ? { role: { name: sort as Prisma.SortOrder } }
          : { [col]: sort as Prisma.SortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
        department: true,
        roleId: true,
        address: true,
        phone: true,
        image: true,
        gender: true,
      },
    });

    // Count total users for pagination metadata
    const totalUsers = await db.user.count({
      where: roleFilter,
    });

    const formUsers = users.map((user) => ({
      ...user,
      role: user.role.name,
    }));

    res.status(200).json({
      message: "Users retrieved successfully",
      data: formUsers,
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
    const token = req.cookies?.token || req.headers?.token;
    if (!token) {
      res.status(401).json({ error: serverError.tokenNotFound });
      return;
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
      userId: string;
    };

    const { role, id } = decodedToken;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as LeaveStatus | undefined;
    const search = req.query.search as string | "";
    const col = req.query.col as string | "name";
    const sort = req.query.sort as string | "asc";

    const leaveFilter = role === "ADMIN" ? {} : { requestTo: id };

    const statusFilter = status ? { status } : {};
    const searchFilter = search
      ? {
          OR: [
            {
              user: {
                name: { contains: search, mode: Prisma.QueryMode.insensitive },
                email: { contains: search, mode: Prisma.QueryMode.insensitive },
              },
            },
            {
              reason: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
          ],
        }
      : {};

    let orderBy;
    switch (col) {
      case "name":
        orderBy = { user: { name: sort as Prisma.SortOrder } };
        break;
      case "email":
        orderBy = { user: { email: sort as Prisma.SortOrder } };
        break;
      case "requestedTo":
        orderBy = { requestedTo: { name: sort as Prisma.SortOrder } };
        break;
      case "startDate":
        orderBy = { startDate: sort as Prisma.SortOrder };
        break;
      case "endDate":
        orderBy = { endDate: sort as Prisma.SortOrder };
        break;
      case "status":
        orderBy = { status: sort as Prisma.SortOrder };
        break;
      case "reason":
        orderBy = { reason: sort as Prisma.SortOrder };
        break;
      case "approvedBy":
        orderBy = { approvedBy: { name: sort as Prisma.SortOrder } };
        break;
      case "leaveType":
        orderBy = { leaveType: sort as Prisma.SortOrder };
        break;
      default:
        orderBy = { createdAt: "desc" as Prisma.SortOrder }; // Default sorting by latest request
    }

    const [leaves, total] = await Promise.all([
      db.leaveRequest.findMany({
        where: {
          ...statusFilter,
          ...leaveFilter,

          ...searchFilter,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy,
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          requestedTo: {
            select: {
              name: true,
              email: true,
            },
          },
          startDate: true,
          endDate: true,
          status: true,
          reason: true,
          approvedBy: {
            select: {
              email: true,
              name: true,
              id: true,
            },
          },
          leaveType: true,
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
    // Validate authentication token
    const token = req.body.token || req.headers.token;

    if (!token) {
      res.status(401).json({ error: serverError.tokenNotFound });
      return;
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
        role: string;
        id: string;
      };
    } catch (error) {
      res.status(403).json({ error: serverError.unauthorized });
      return;
    }

    // Extract and validate request parameters
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      res.status(400).json({ error: "Leave ID is required" });
      return;
    }

    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      res.status(400).json({ error: "Invalid leave status" });
      return;
    }

    // Retrieve existing leave request
    const existingLeave = await db.leaveRequest.findUnique({
      where: { id: id },
    });

    if (!existingLeave) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    if (existingLeave.status === status) {
      res.status(400).json({ error: "Leave status is already updated" });
      return;
    }

    // Determine the leave balance adjustment based on status change
    let leaveAdjustment = 0;
    const leaveValue = existingLeave.leaveType === "HALF_DAY" ? 0.5 : 1;

    if (existingLeave.status === "PENDING" && status === "APPROVED") {
      leaveAdjustment = -leaveValue;
    } else if (existingLeave.status === "PENDING" && status === "REJECTED") {
      leaveAdjustment = 0;
    } else if (existingLeave.status === "APPROVED" && status === "REJECTED") {
      leaveAdjustment = leaveValue;
    } else if (existingLeave.status === "REJECTED" && status === "APPROVED") {
      leaveAdjustment = -leaveValue;
    }

    const totalDays =
      existingLeave.endDate.getDate() - existingLeave.startDate.getDate();

    leaveAdjustment = leaveAdjustment * (totalDays + 1);

    // Update leave status and associated user leave balance within a transaction
    const [updatedLeave, newLeaveTable] = await db.$transaction([
      db.leaveRequest.update({
        where: { id: id },
        data: {
          status,
          approveBy: decodedToken.id,
        },
      }),
      db.userLeaveTable.update({
        where: { userId: existingLeave.userId },
        data: {
          availableLeave: {
            increment: leaveAdjustment,
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Leave status updated successfully",
      data: updatedLeave,
      newLeaveTable: newLeaveTable,
    });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ error: serverError.internalServerError });
    return;
  }
};

export const dashboardInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [
      pendingCount,
      approvedCount,
      rejectedCount,
      totalUsers,
      totalLeaves,
    ] = await Promise.all([
      await db.leaveRequest.count({ where: { status: "PENDING" } }),
      await db.leaveRequest.count({ where: { status: "APPROVED" } }),
      await db.leaveRequest.count({ where: { status: "REJECTED" } }),
      await db.user.count(),
      await db.leaveRequest.count(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingCount,
        approvedCount,
        rejectedCount,
        totalUsers,
        totalLeaves,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard info:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const getStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await db.user.findMany({
      where: { roleId: "3" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
      },
    });

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ success: false, error: serverError.internalServerError });
  }
};
