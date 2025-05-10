/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/audiences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AudienceSegmentModel from '@/models/audienceSegment';
import { AudienceRuleSet, IRuleCondition, IRuleGroup } from '@/models/campaign'; // Assuming Campaign.ts exports these
import { z } from 'zod';
import UserModel from '@/models/user';
// You would typically import your Zod schemas for rules from a shared location
// For brevity, I'll redefine a simplified version here or assume they are available.
import { auth } from "@/auth";
import { baseRuleGroupSchema } from '@/lib/validations';

// --- Zod Schemas for Rule Validation (ensure these match your Campaign model's needs) ---


type RuleGroupInput = z.infer<typeof baseRuleGroupSchema> & {
  groups?: RuleGroupInput[];
};

const ruleGroupSchema: z.ZodType<RuleGroupInput> = baseRuleGroupSchema.extend({
  groups: z.lazy(() => z.array(ruleGroupSchema)).optional(),
});

const audienceRuleSetSchema: z.ZodType<AudienceRuleSet> = ruleGroupSchema;

const createAudienceSegmentSchema = z.object({
  name: z.string().min(3, "Segment name must be at least 3 characters long.").trim(),
  description: z.string().trim().optional(),
  rules: audienceRuleSetSchema,
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createAudienceSegmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, rules } = validation.data;

    // Check if an audience segment with this name already exists
    const existingSegment = await AudienceSegmentModel.findOne({ name });
    if (existingSegment) {
      return NextResponse.json(
        { message: `An audience segment with the name "${name}" already exists.` },
        { status: 409 } // Conflict
      );
    }

    const newAudienceSegment = new AudienceSegmentModel({
      name,
      description,
      rules,
      createdBy: session.user?.id, // If using authentication
    });

    await newAudienceSegment.save();

    return NextResponse.json(
      { message: "Audience segment saved successfully", audienceSegment: newAudienceSegment },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error saving audience segment:", error);
    if (error.code === 11000) { // MongoDB duplicate key error
        return NextResponse.json(
            { message: `Audience segment with name "${error.keyValue.name}" already exists (duplicate key).` },
            { status: 409 }
        );
    }
    return NextResponse.json(
      { message: "Failed to save audience segment", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // TODO: Add authentication if these segments are user-specific or protected
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // Fetch all audience segments, sorted by creation date
    // and optionally populate the createdBy field if you have it
    const audienceSegments = await AudienceSegmentModel.find({})
      .sort({ createdAt: -1 }) // Most recent first
      .populate('createdBy', 'name email') // If you have a createdBy field
      .setOptions({ strictPopulate: false });
    return NextResponse.json({ audienceSegments }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching audience segments:", error);
    return NextResponse.json(
      { message: "Failed to fetch audience segments", error: error.message },
      { status: 500 }
    );
  }
}
