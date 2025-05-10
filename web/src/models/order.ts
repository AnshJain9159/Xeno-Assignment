// db/models/Order.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import "@/models/customer"
// Interface for the Order document
export interface IOrder extends Document {
  orderId: string; 
  customerId: Schema.Types.ObjectId; 
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
    ref: 'Customer', 
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
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

const OrderModel: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default OrderModel;
