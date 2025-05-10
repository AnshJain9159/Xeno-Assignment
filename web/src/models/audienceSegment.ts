/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Schema, Document } from 'mongoose';
import { AudienceRuleSet } from '@/models/campaign'; // Make sure this path is correct
import User from '@/models/user'; // Ensures User is registered

// Interface
export interface IAudienceSegment extends Document {
  name: string;
  description?: string;
  rules: AudienceRuleSet;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema
const AudienceSegmentSchema: Schema<IAudienceSegment> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    rules: {
      type: Schema.Types.Mixed,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const AudienceSegment =
  mongoose.models.AudienceSegment ||
  mongoose.model<IAudienceSegment>('AudienceSegment', AudienceSegmentSchema);

export default AudienceSegment;