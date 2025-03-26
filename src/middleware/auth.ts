import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare module "express" {
  interface Request {
    user?: any;
  }
}

export const auth = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

      jwt.verify(token, secret, (err: any, decoded: any) => {
        if (err) {
          res.status(401).json({ error: "Invalid or expired token." });
          console.error("Authentication error:", err);
          return;
        }

        if (!allowedRoles.includes(decoded.role)) {
          res
            .status(403)
            .json({ error: "Access forbidden. Insufficient permissions." });
          return;
        }
        req.user = decoded;

        next();
      });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  };
};
