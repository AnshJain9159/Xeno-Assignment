import { z } from "zod"
import mongoose from "mongoose";
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

// Zod schema for order data validation
export const orderSchema = z.object({
  orderId: z.string().min(1, { message: "Order ID is required" }).trim(),
  customerId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Customer ID format",
  }),
  orderAmount: z.number().min(0, { message: "Order amount cannot be negative" }),
  orderDate: z.string().datetime({ offset: true }).transform((val) => new Date(val)),
});

// Zod schema for customer data validation
export const customerSchema = z.object({
  name: z.string().min(1, { message: "Customer name is required" }).trim(),
  email: z.string().email({ message: "Invalid email address" }).trim().toLowerCase(),
  totalSpends: z.number().min(0, { message: "Total spends cannot be negative" }).optional().default(0),
  visitCount: z.number().int().min(0, { message: "Visit count cannot be negative" }).optional().default(0),
  lastActiveDate: z.string().datetime({ offset: true }).optional().transform((val) => val ? new Date(val) : undefined),
});
