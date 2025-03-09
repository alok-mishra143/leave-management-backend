import z from 'zod';

export const userSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  address: z.string().min(1, "Address must be at least 1 character long.").optional(),
  name: z.string().min(1, "Name must be at least 1 character long."),
  role: z.string().min(1, "Role is required."),
  gender: z.enum(['MALE', 'FEMALE']).refine(val => val === 'MALE' || val === 'FEMALE', {
    message: "Gender must be either 'MALE' or 'FEMALE'."
  }),
  image: z.string().min(1, "Image URL must be at least 1 character long.").optional(),
});

export const loginValidation = userSchema.pick({
  email: true,
  password: true,
});
