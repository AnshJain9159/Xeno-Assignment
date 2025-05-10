// db/models/Customer.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for the Customer document
export interface ICustomer extends Document {
  name: string;
  email: string;
  totalSpends: number;
  visitCount: number;
  lastActiveDate?: Date; // Optional: can be updated when they interact
  createdBy: Schema.Types.ObjectId; // Optional: Reference to the User who created it
  
}

// Mongoose schema for Customer
const CustomerSchema: Schema<ICustomer> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Customer email is required'],
    unique: true, // Assuming each customer email should be unique in the CRM
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email address for the customer',
    ],
  },
  totalSpends: {
    type: Number,
    default: 0,
    min: [0, 'Total spends cannot be negative'],
  },
  visitCount: {
    type: Number,
    default: 0,
    min: [0, 'Visit count cannot be negative'],
  },
  lastActiveDate: {
    type: Date,
    optional: true,
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Ensure the model is not recompiled if it already exists
const CustomerModel: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default CustomerModel;
