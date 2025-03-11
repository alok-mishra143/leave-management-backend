import { Department } from "@prisma/client";
import z from "zod";

export const userSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  address: z.string().min(1, "Address must be at least 1 character long."),
  name: z.string().min(1, "Name must be at least 1 character long."),
  role: z.string().min(1, "Role is required."),
  phone: z
    .number()
    .min(1, "Phone must be at least 1 character long.")
    .max(9999999999, "not more then 10 number"),
  gender: z
    .enum(["MALE", "FEMALE"])
    .refine((val) => val === "MALE" || val === "FEMALE", {
      message: "Gender must be either 'MALE' or 'FEMALE'.",
    }),
  department: z.enum([Department.ADMIN, Department.CSE, Department.EEE]),

  image: z.string().min(1, "Image URL must be at least 1 character long."),
});

export const loginValidation = userSchema.pick({
  email: true,
  password: true,
});

export const signUpValidation = userSchema.pick({
  email: true,
  password: true,
  name: true,
  role: true,
  gender: true,
  image: true,
  phone: true,
  address: true,
  department: true,
});
