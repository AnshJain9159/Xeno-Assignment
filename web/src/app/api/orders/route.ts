/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // Assuming db/index.ts for connection
import OrderModel from '@/models/order';
import CustomerModel from '@/models/customer'; // To verify customerId
import mongoose from 'mongoose';
import { orderSchema } from '@/lib/validations';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect(); // Ensure database connection
    
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const validation = orderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { orderId, customerId, orderAmount, orderDate } = validation.data;

    // 1. Check if an order with this orderId already exists
    const existingOrder = await OrderModel.findOne({ orderId });
    if (existingOrder) {
        return NextResponse.json(
            { message: `Order with ID ${orderId} already exists.`},
            { status: 409} // 409 Conflict
        );
    }

    // 2. Validate if the customerId exists
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { message: `Customer with ID ${customerId} not found.` },
        { status: 404 } // 404 Not Found
      );
    }

    // Create new order
    const newOrder = new OrderModel({
      orderId,
      customerId: new mongoose.Types.ObjectId(customerId), // Ensure it's an ObjectId
      orderAmount,
      orderDate,
    });

    await newOrder.save();

    // Optionally, you might want to update the customer's totalSpends and visitCount here
    // For simplicity, this is kept separate, but in a real app, you might do it in a transaction.
    // Example:
    customer.totalSpends += orderAmount;
    customer.visitCount += 1; // Or based on your logic for visits
    customer.lastActiveDate = new Date(); // Update last active date
    await customer.save();

    return NextResponse.json(
      { message: "Order created successfully", order: newOrder },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating order:", error);
     if (error.code === 11000) { // MongoDB duplicate key error for orderId
        return NextResponse.json(
            { message: `Order with ID ${error.keyValue.orderId} already exists (duplicate key).` },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { message: "Failed to create order", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Populate customer details when fetching orders
    const orders = await OrderModel.find({})
      .populate('customerId', 'name email') // Populate name and email from Customer model
      .sort({ orderDate: -1 }); 
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { message: "Failed to fetch orders", error: error.message },
      { status: 500 }
    );
  }
}
