import { db } from "../db/prismaClient";
import { Department, LeaveStatus, Prisma } from "@prisma/client";
import { errorMeassage, Role, RoleId } from "../constants/Meassage";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  studentSignupValidation,
  studentUpdateValidation,
} from "../validations/authValidation";
import {
  applyLeaveValidation,
  editLeaveValidation,
} from "../validations/leaveValidation";

const { serverError, userError, leaveError, statusCodes } = errorMeassage;

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

    if (!validation.success) {
      res.status(statusCodes.badRequest).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { address, department, email, gender, name, phone } = validation.data;

    const student = await db.user.update({
      where: { email },
      data: {
        address,
        department,
        gender,
        name,
        phone: phone.toString(),
      },
    });

    res
      .status(statusCodes.ok)
      .json({ message: userError.userUpdated, student });
  } catch (error) {
    console.log(error);
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const applyLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(statusCodes.forbidden).json({ error: userError.invalidInput });
      return;
    }

    const validation = applyLeaveValidation.safeParse(req.body);

    if (!validation.success) {
      res.status(statusCodes.noContent).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { endDate, leaveType, reason, requestedTo, startDate } =
      validation.data;

    const requestedPerson = await db.user.findUnique({
      where: { id: requestedTo },
    });

    if (!requestedPerson) {
      res
        .status(statusCodes.badRequest)
        .json({ error: userError.invalidInput });
      return;
    }

    const leave = await db.leaveRequest.create({
      data: {
        endDate,
        leaveType,
        reason,
        requestTo: requestedPerson.id,
        startDate,
        status: LeaveStatus.PENDING,
        approveBy: null,
        userId: id,
      },
    });

    res
      .status(statusCodes.created)
      .json({ message: leaveError.leaveCreated, leave });
  } catch (error) {
    console.log(error);
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

// ! no use delete this

/*
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
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

*/
export const getPersonalLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res
        .status(statusCodes.badRequest)
        .json({ error: userError.invalidInput });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || undefined;
    const col = (req.query.col as string) || "createdAt";
    const sort = (req.query.sort as string) || "desc";

    const statusFilter = status ? { status: status as LeaveStatus } : {};
    const searchFilter = search
      ? {
          OR: [
            {
              requestedTo: {
                name: { contains: search, mode: Prisma.QueryMode.insensitive },
              },
            },
            {
              reason: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
            {
              approvedBy: {
                name: { contains: search, mode: Prisma.QueryMode.insensitive },
              },
            },
          ],
        }
      : {};

    let sortQuery;

    switch (col) {
      case "startDate":
        sortQuery = { startDate: sort as Prisma.SortOrder };
        break;
      case "endDate":
        sortQuery = { endDate: sort as Prisma.SortOrder };
        break;
      case "status":
        sortQuery = { status: sort as Prisma.SortOrder };
        break;
      case "requestedTo":
        sortQuery = { requestedTo: { name: sort as Prisma.SortOrder } };
        break;
      case "approvedBy":
        sortQuery = { approvedBy: { name: sort as Prisma.SortOrder } };
        break;
      default:
        sortQuery = { createdAt: sort as Prisma.SortOrder };
        break;
    }

    const [leave, total] = await Promise.all([
      db.leaveRequest.findMany({
        where: { userId: id, ...searchFilter, ...statusFilter },
        orderBy: sortQuery,

        select: {
          id: true,
          leaveType: true,
          reason: true,
          startDate: true,
          endDate: true,
          status: true,
          requestedTo: {
            select: {
              name: true,
              id: true,
            },
          },
          approvedBy: {
            select: {
              name: true,
            },
          },
          createdAt: true,
        },
        take: limit,
        skip: skip,
      }),
      db.leaveRequest.count({ where: { userId: id } }),
    ]);

    res.status(statusCodes.ok).json({
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
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const getLeaveBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res
        .status(statusCodes.badRequest)
        .json({ error: userError.invalidInput });
      return;
    }

    const userLeave = await db.userLeaveTable.findUnique({
      where: { userId: id },
      select: {
        totalLeaves: true,
        availableLeave: true,
        usedLeaves: true,
      },
    });

    res.status(statusCodes.ok).json({ userLeave });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

// select teachers for leave

export const getTeacherForLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const department = req.params.department?.trim().toString();
    const token = req.cookies?.token || req.headers?.token;

    const secret = process.env.JWT_SECRET!;

    let role = Role.STUDENT;

    jwt.verify(token, secret, (err: any, decoded: any) => {
      role = decoded.role;
    });

    const whomToRequest = role === Role.STUDENT ? RoleId.STAFF : RoleId.HOD;

    const departmentFilter = department
      ? { department: department as Department }
      : {};

    if (
      !department ||
      !Object.values(Department).includes(department as Department)
    ) {
      res
        .status(statusCodes.forbidden)
        .json({ success: false, error: userError.invalidInput });
      return;
    }

    const teachers = await db.user.findMany({
      where: {
        ...departmentFilter,
        roleId: whomToRequest,
      },
      select: { id: true, name: true },
    });

    res.status(statusCodes.ok).json({ data: teachers });
  } catch (error) {
    console.error("Error fetching teachers for leave:", error);
    res
      .status(statusCodes.internalServerError)
      .json({ success: false, error: serverError.internalServerError });
  }
};

export const EditLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validation = editLeaveValidation.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: userError.invalidInput,
        details: validation.error.errors,
      });
      return;
    }

    const { endDate, leaveType, reason, requestedTo, startDate } =
      validation.data;

    console;

    const leave = await db.leaveRequest.update({
      where: { id },
      data: {
        endDate,
        leaveType,
        reason,
        requestTo: requestedTo,
        startDate,
      },
    });

    res.status(200).json({ message: leaveError.leaveUpdated, leave });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const deleteLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res
        .status(statusCodes.badRequest)
        .json({ error: userError.invalidInput });
      return;
    }

    await db.leaveRequest.delete({ where: { id } });

    res.status(200).json({ message: leaveError.leaveDeleted });
  } catch (error) {
    console.error("Error deleting leave:", error);
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

// for calender events maping

export const getAllApprovedLeaves = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const approvedLeaves = await db.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        user: { select: { name: true } },
        leaveType: true,
      },
    });

    const filterLeaves = approvedLeaves.map((leave) => {
      return {
        id: leave.id.toString(),
        title: leave.user.name,
        start: leave.startDate.toISOString().split("T")[0],
        end: leave.endDate.toISOString().split("T")[0],
        calendarId: leave.leaveType,
      };
    });

    res.status(200).json({ data: filterLeaves });
  } catch (error) {
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};
