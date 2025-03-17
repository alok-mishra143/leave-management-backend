import { Department, Gender } from "@prisma/client";
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
  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: "Invalid Gender" }),
  }),
  department: z.nativeEnum(Department, {
    errorMap: () => ({ message: "Invalid department" }),
  }),
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
  phone: true,
  address: true,
  department: true,
});

export const updateUserValidation = userSchema.pick({
  email: true,
  name: true,
  role: true,
  gender: true,
  phone: true,
  address: true,
  department: true,
});
export const studentSignupValidation = signUpValidation.omit({ role: true });
export const studentUpdateValidation = updateUserValidation;
