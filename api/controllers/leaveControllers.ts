import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/prismaClient";
import { errorMeassage, Role, RoleId } from "../constants/Meassage";
import { Department, LeaveStatus, Prisma } from "@prisma/client";
import {
  applyLeaveValidation,
  editLeaveValidation,
} from "../validations/leaveValidation";
const { serverError, userError, leaveError, statusCodes } = errorMeassage;

export const viewLeaves = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, role } = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as LeaveStatus | undefined;
    const search = req.query.search as string | "";
    const col = req.query.col as string | "name";
    const sort = req.query.sort as string | "asc";
    const leave = req.query.leave as string | null;

    let leaveFilter = {};

    if (role === Role.ADMIN) {
      if (leave === "all") {
        leaveFilter = {};
      } else {
        leaveFilter = { requestTo: id };
      }
    } else if (role === Role.HOD) {
      if (leave === "all") {
        leaveFilter = {
          user: {
            id: { not: id },
            department: req.user.department as Department,
          },
        };
      } else {
        leaveFilter = { requestTo: id };
      }
    } else if (role === Role.STAFF) {
      leaveFilter = { requestTo: id };
    }

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
        orderBy = { createdAt: "desc" as Prisma.SortOrder };
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

    res.status(statusCodes.ok).json({
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
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
  }
};

export const updateLeaveStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body as { status: LeaveStatus };

    if (!id) {
      res
        .status(statusCodes.badRequest)
        .json({ error: leaveError.leaveIdRequire });
      return;
    }

    const existingLeave = await db.leaveRequest.findUnique({
      where: { id: id },
    });

    if (!existingLeave) {
      res.status(404).json({ error: leaveError.leaveNotFound });
      return;
    }

    if (existingLeave.status === status) {
      res
        .status(statusCodes.badRequest)
        .json({ error: leaveError.invalidLeaveType });
      return;
    }

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
      (new Date(existingLeave.endDate).getTime() -
        new Date(existingLeave.startDate).getTime()) /
      (1000 * 60 * 60 * 24);

    leaveAdjustment = leaveAdjustment * (totalDays + 1);

    const [updatedLeave, newLeaveTable] = await db.$transaction([
      db.leaveRequest.update({
        where: { id: id },
        data: {
          status,
          approveBy: userId,
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

    res.status(statusCodes.ok).json({
      success: true,
      message: leaveError.leaveUpdated,
      data: updatedLeave,
      newLeaveTable: newLeaveTable,
    });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res
      .status(statusCodes.internalServerError)
      .json({ error: serverError.internalServerError });
    return;
  }
};

export const applyLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.user!;

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

export const getTeacherForLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { role, department } = req.user!;

    let whomToRequest: RoleId;
    let departmentFilter = {};

    if (role === Role.STUDENT) {
      whomToRequest = RoleId.STAFF;
      departmentFilter = { department: department as Department };
    } else if (role === Role.STAFF) {
      whomToRequest = RoleId.HOD;
      departmentFilter = { department: department as Department };
    } else if (role === Role.HOD) {
      whomToRequest = RoleId.ADMIN;
    } else {
      whomToRequest = RoleId.ADMIN;
    }

    if (
      role !== Role.HOD && // Only validate department for non-HOD users
      (!department ||
        !Object.values(Department).includes(department as Department))
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
