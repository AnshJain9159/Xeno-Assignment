// db/models/Campaign.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for a single rule condition
export interface IRuleCondition {
  field: 'totalSpends' | 'visitCount' | 'lastActiveDate' | 'name' | 'email'; // Add more customer fields as needed
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'OLDER_THAN_DAYS' | 'IN_LAST_DAYS';
  value: string | number | Date;
  dataType?: 'string' | 'number' | 'date'; // To help with parsing and querying
}

// Interface for a group of rules
export interface IRuleGroup {
  logicalOperator: 'AND' | 'OR'; // How conditions within this group and sub-groups are combined
  conditions: IRuleCondition[];
  groups?: IRuleGroup[]; // For nested AND/OR logic
}

// Top-level audience rules structure
export type AudienceRuleSet = IRuleGroup;

// Interface for the Campaign document
export interface ICampaign extends Document {
  name: string;
  audienceRules: AudienceRuleSet;
  messageTemplate: string; // e.g., "Hi {{name}}, here's a 10% off!"
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  audienceSize: number;
  sentCount: number;
  failedCount: number;
  createdBy: Schema.Types.ObjectId; // Reference to the User who created it (from NextAuth)
  createdAt: Date;
  updatedAt: Date;
  failureReason: string;
  tags: string[];
}

// Mongoose schema for Campaign
const CampaignSchema: Schema<ICampaign> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
  },
  audienceRules: { // Storing as Mixed type, validation will be at application level or via Zod in API
    type: Schema.Types.Mixed,
    required: [true, 'Audience rules are required'],
  },
  messageTemplate: {
    type: String,
    required: [true, 'Message template is required'],
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED'],
    default: 'DRAFT',
  },
  audienceSize: {
    type: Number,
    default: 0,
    min: 0,
  },
  sentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Ensure only authenticated users can create campaigns
  },
  tags: {
    type: [String],
    default: [],
  },
}, { timestamps: true },
  
);

// Ensure the model is not recompiled if it already exists
const CampaignModel: Model<ICampaign> = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default CampaignModel;
