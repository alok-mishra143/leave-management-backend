import type { Request, Response, NextFunction } from "express";
import { db } from "../db/prismaClient";
import jwt from "jsonwebtoken";

declare module "express" {
  interface Request {
    user?: any;
  }
}

export const auth = (allowedRoles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.cookies?.token || req.headers?.token;

      if (!token) {
        res.status(401).json({ error: "Access denied. No token provided." });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      // Verify token using async/await
      const decoded = jwt.verify(token, secret) as { id: string; role: string };

      // Fetch user from the database
      const user = await db.user.findUnique({
        where: {
          id: decoded.id,
        },
        select: {
          id: true,
          roleId: true,
          name: true,
          email: true,
          image: true,
          department: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found." });
        res.clearCookie("token");
        return;
      }

      const filterUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role.name,
        roleId: user.roleId,
        department: user.department,
      };

      const role = await db.role.findUnique({
        where: {
          id: user.roleId,
        },
      });

      // Check if user's role is allowed
      if (!allowedRoles.includes(role?.name || "")) {
        res
          .status(403)
          .json({ error: "Access forbidden. Insufficient permissions." });
        return;
      }

      req.user = filterUser;

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  };
};
