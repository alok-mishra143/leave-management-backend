import jwt from "jsonwebtoken";

export const tokenVerify = async (
  token: string
): Promise<{ id: string } | null> => {
  // ✅ Fixed return type
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("No secret provided");
    }

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
    };

    return { id: decoded.id }; // ✅ Return structure fixed
  } catch (error) {
    return null;
  }
};
