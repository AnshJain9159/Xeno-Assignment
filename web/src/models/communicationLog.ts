// db/models/CommunicationLog.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'OPENED' | 'CLICKED'; // More granular status

// Interface for the CommunicationLog document
export interface ICommunicationLog extends Document {
  campaignId: Schema.Types.ObjectId;    // Reference to the Campaign
  customerId: Schema.Types.ObjectId;    // Reference to the Customer
  message: string;                      // The actual personalized message sent
  status: MessageStatus;
  vendorMessageId?: string;             // ID from the dummy vendor API, if any
  sentAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  deliveredAt?: Date;                   // When delivery receipt is confirmed
  createdBy: Schema.Types.ObjectId;  // User who initiated the campaign
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for CommunicationLog
const CommunicationLogSchema: Schema<ICommunicationLog> = new mongoose.Schema({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'DELIVERED', 'OPENED', 'CLICKED'],
    default: 'PENDING',
    index: true,
  },
  vendorMessageId: {
    type: String,
    optional: true,
  },
  sentAt: {
    type: Date,
    optional: true,
  },
  failedAt: {
    type: Date,
    optional: true,
  },
  failureReason: {
    type: String,
    optional: true,
  },
  deliveredAt: {
    type: Date,
    optional: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Ensure the model is not recompiled if it already exists
const CommunicationLogModel: Model<ICommunicationLog> = mongoose.models.CommunicationLog || mongoose.model<ICommunicationLog>('CommunicationLog', CommunicationLogSchema);

export default CommunicationLogModel;
