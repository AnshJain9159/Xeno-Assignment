import { z } from "zod"
//yeh saare schmas hai signin,signup ke
export const signUpSchema = z.object({
    fullName: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
});
  
export const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});