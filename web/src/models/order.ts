// db/models/Order.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for the Order document
export interface IOrder extends Document {
  orderId: string; // A unique identifier for the order
  customerId: Schema.Types.ObjectId; // Reference to the Customer who placed the order
  orderAmount: number;
  orderDate: Date;
  // Potentially add more details like items, status, etc.
}

// Mongoose schema for Order
const OrderSchema: Schema<IOrder> = new mongoose.Schema({
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    unique: true,
    trim: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer', // This creates a reference to the Customer model
    required: [true, 'Customer ID is required for an order'],
  },
  orderAmount: {
    type: Number,
    required: [true, 'Order amount is required'],
    min: [0, 'Order amount cannot be negative'],
  },
  orderDate: {
    type: Date,
    required: [true, 'Order date is required'],
    default: Date.now,
  },
  // Example of adding order items if needed in the future:
  // items: [{
  //   productId: { type: String, required: true },
  //   productName: { type: String },
  //   quantity: { type: Number, required: true, min: 1 },
  //   price: { type: Number, required: true },
  // }],
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Ensure the model is not recompiled if it already exists
const OrderModel: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default OrderModel;
