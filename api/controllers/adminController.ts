import { db } from "../db/prismaClient";
import { Department, Prisma } from "@prisma/client";
import {
  signUpValidation,
  updateUserValidation,
} from "../validations/authValidation";
import type { Request, Response } from "express";
import { errorMeassage, RoleId } from "../constants/Meassage";

const { serverError, userError, statusCodes, paginationError } = errorMeassage;

export const signUpUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = signUpValidation.safeParse(req.body);
    if (!validation.success) {
      res.status(statusCodes.badRequest).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
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
      res.status(statusCodes.badRequest).json({ error: userError.userExists });
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

    res.status(statusCodes.created).json({
      message: userError.userCreated,
      user: newUser,
      leaveTable: createLeaveTable,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
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
      res.status(statusCodes.badRequest).json({
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
    res
      .status(statusCodes.ok)
      .json({ message: userError.userUpdated, user: updateUser });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
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

    res
      .status(statusCodes.ok)
      .json({ message: userError.deletedSucessfully, user: deleteUser });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: serverError.internalServerError });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract query parameters with default values
    const { id, department } = req.user;

    const roleID = req.query.roleID as string | "";
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const sort = req.query.sort as string | "asc";
    const col = req.query.col as string | "createdAt";
    const search = req.query.search as string | "";

    // Validate pagination values
    if (limit < 1 || page < 1) {
      res
        .status(statusCodes.badRequest)
        .json({ error: paginationError.invalidPagination });
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

    const departmentFilter =
      department != Department.ADMIN
        ? { department: department as Department }
        : { department: {} };

    console.log("Department Filter:", departmentFilter);

    // Fetch users with optional role filtering and pagination
    const users = await db.user.findMany({
      where: {
        ...roleFilter,
        ...searchFilter,
        ...departmentFilter,
        id: { not: id },
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
      where: {
        ...roleFilter,
        ...departmentFilter,
        id: { not: id },
      },
    });

    const formUsers = users.map((user) => ({
      ...user,
      role: user.role.name,
    }));

    res.status(statusCodes.ok).json({
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
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
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

    res.status(statusCodes.ok).json({
      success: true,
      data: {
        pendingCount,
        approvedCount,
        rejectedCount,
        totalUsers,
        totalLeaves,
      },
    });

    console.log("/dashboard route is working");
  } catch (error) {
    console.error("Error fetching dashboard info:", error);
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const getStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await db.user.findMany({
      where: { roleId: RoleId.STUDENT },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
      },
    });

    res.status(statusCodes.ok).json({ success: true, data: students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(statusCodes.internalServerError)
      .json({ success: false, error: serverError.internalServerError });
  }
};
