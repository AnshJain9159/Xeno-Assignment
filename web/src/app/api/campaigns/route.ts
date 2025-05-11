/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // Assuming db/index.ts for connection
import CampaignModel, { AudienceRuleSet, IRuleGroup, IRuleCondition } from '@/models/campaign';
import CustomerModel, { ICustomer } from '@/models/customer';
import CommunicationLogModel from '@/models/communicationLog';
import { z } from 'zod';
import mongoose, { Types } from 'mongoose';
import { auth } from "@/auth";
import { baseRuleGroupSchema } from '@/lib/validations';

type RuleGroupInput = z.infer<typeof baseRuleGroupSchema> & {
  groups?: RuleGroupInput[];
};
const ruleGroupSchema: z.ZodType<RuleGroupInput> = baseRuleGroupSchema.extend({
  groups: z.lazy(() => z.array(ruleGroupSchema)).optional(),
});
const audienceRuleSetSchema: z.ZodType<AudienceRuleSet> = ruleGroupSchema;

const createCampaignSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  audienceRules: audienceRuleSetSchema,
  messageTemplate: z.string().min(10, "Message template must be at least 10 characters"),
});
// --- End Zod Schemas ---

// Re-use or import buildMongoQuery from audience preview route
const buildMongoQuery = (ruleSet: AudienceRuleSet): mongoose.FilterQuery<any> => {
  const parseGroup = (group: IRuleGroup): mongoose.FilterQuery<any> => {
    const mongoConditions: mongoose.FilterQuery<any>[] = [];
    group.conditions.forEach(condition => {
      mongoConditions.push(parseCondition(condition));
    });
    if (group.groups && group.groups.length > 0) {
      group.groups.forEach(subGroup => {
        mongoConditions.push(parseGroup(subGroup));
      });
    }
    if (mongoConditions.length === 0) return {};
    if (mongoConditions.length === 1) return mongoConditions[0];
    return group.logicalOperator === 'AND' ? { $and: mongoConditions } : { $or: mongoConditions };
  };
  const parseCondition = (condition: IRuleCondition): mongoose.FilterQuery<any> => {
    const { field, operator, value } = condition;
    let queryValue = value;
    if (field === 'lastActiveDate' && (operator === 'OLDER_THAN_DAYS' || operator === 'IN_LAST_DAYS')) {
      const days = Number(value);
      if (isNaN(days)) throw new Error(`Invalid number of days for ${operator}: ${value}`);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);
      if (operator === 'OLDER_THAN_DAYS') return { [field]: { $lt: dateThreshold } };
      return { [field]: { $gte: dateThreshold } };
    } else if (condition.dataType === 'date') {
        queryValue = new Date(value as string);
        if (isNaN(queryValue.getTime())) throw new Error(`Invalid date value for ${field}: ${value}`);
    }
    let mongoOperator: string;
    switch (operator) {
      case 'EQUALS': mongoOperator = '$eq'; break;
      case 'NOT_EQUALS': mongoOperator = '$ne'; break;
      case 'GREATER_THAN': mongoOperator = '$gt'; break;
      case 'LESS_THAN': mongoOperator = '$lt'; break;
      case 'CONTAINS': mongoOperator = '$regex'; queryValue = new RegExp(String(value), 'i').toString(); break;
      case 'STARTS_WITH': mongoOperator = '$regex'; queryValue = new RegExp('^' + String(value), 'i').toString(); break;
      case 'ENDS_WITH': mongoOperator = '$regex'; queryValue = new RegExp(String(value) + '$', 'i').toString(); break;
      default: throw new Error(`Unsupported operator: ${operator}`);
    }
    return { [field]: { [mongoOperator]: queryValue } };
  };
  return parseGroup(ruleSet);
};


// Helper function to personalize message
function personalizeMessage(template: string, customer: ICustomer): string {
    // Basic personalization, can be expanded
    return template
        .replace(/{{name}}/gi, customer.name)
        .replace(/{{email}}/gi, customer.email)
        .replace(/{{totalSpends}}/gi, String(customer.totalSpends))
        .replace(/{{visitCount}}/gi, String(customer.visitCount));
}

const DUMMY_VENDOR_API_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/dummy-vendor/send`;
const DELIVERY_RECEIPT_CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/delivery-receipts`;

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    // TODO: Add authentication check here to get current userId for 'createdBy' field
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user?.id; // Assuming user ID is available in session
    const body = await request.json();
    const validation = createCampaignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, audienceRules, messageTemplate } = validation.data;

    // 1. Calculate audience size
    const mongoQuery = buildMongoQuery(audienceRules);
    let audienceSize = 0;
    let customersInSegment: ICustomer[] = [];

    if (Object.keys(mongoQuery).length > 0) {
        customersInSegment = await CustomerModel.find(mongoQuery).lean(); // .lean() for performance if only reading
        audienceSize = customersInSegment.length;
    } else { // If rules result in an empty query, it might mean all customers or no customers based on logic.
        // For this assignment, let's assume empty query means target all if no rules, or error if rules were expected but invalid.
        // The preview API handles this, here we assume valid rules or intent to target all if rules are empty.
        // If audienceRules.conditions and audienceRules.groups are empty, it means target all.
        if (audienceRules.conditions.length === 0 && (!audienceRules.groups || audienceRules.groups.length === 0)) {
            customersInSegment = await CustomerModel.find({}).lean();
            audienceSize = customersInSegment.length;
        }
    }


    if (audienceSize === 0) {
        // Optionally save as DRAFT if no audience, or return error
        // For now, let's allow creating it, but it won't send.
        console.warn(`Campaign "${name}" created with an audience size of 0 based on rules.`);
    }

    // 2. Create and save the campaign
    const newCampaign = new CampaignModel({
      name,
      audienceRules,
      messageTemplate,
      audienceSize,
      status: 'DRAFT', // Always DRAFT on creation! Delivery is triggered by the deliver route.
      createdBy: userId, // From session
    });
    await newCampaign.save();

    // 3. Initiate campaign delivery (asynchronously in a real app)
    // For now, doing it synchronously. This should be offloaded.
    if (audienceSize > 0) {
      const communicationLogs = customersInSegment.map(customer => ({
        campaignId: newCampaign._id,
        customerId: customer._id,
        message: personalizeMessage(messageTemplate, customer), // Personalize message
        status: 'PENDING',
        createdBy: userId,
      }));

      if (communicationLogs.length > 0) {
        await CommunicationLogModel.insertMany(communicationLogs);

        // Fetch the logs you just created (to get their _id)
        const logs = await CommunicationLogModel.find({ campaignId: newCampaign._id });
        for (const log of logs) {
          const customer = customersInSegment.find(c => (c._id as Types.ObjectId).equals(log.customerId));
          if (!customer) continue;
          const payload = {
            customerId: (customer._id as Types.ObjectId).toString(),
            customerEmail: customer.email,
            message: log.message,
            communicationLogId: (log._id as Types.ObjectId).toString(),
            callbackUrl: DELIVERY_RECEIPT_CALLBACK_URL,
          };
        
          // Fire-and-forget (do not await, or use Promise.all for demo)
          fetch(DUMMY_VENDOR_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then(res => {
            console.log(`Dummy vendor API called for log ${log._id}, status: ${res.status}`);
          }).catch(err => {
            console.error(`Error calling dummy vendor API for log ${log._id}:`, err);
          });
        }
      }
      console.log(`Campaign ${newCampaign.name} created. ${communicationLogs.length} messages logged as PENDING.`);
    }


    return NextResponse.json({ message: "Campaign created successfully", campaign: newCampaign }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ message: "Failed to create campaign", error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // TODO: Add authentication check here
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await CampaignModel.find({})
      .sort({ createdAt: -1 }) // Most recent first
      .populate('createdBy', 'fullName email'); // If you add createdBy

    return NextResponse.json({ campaigns }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ message: "Failed to fetch campaigns", error: error.message }, { status: 500 });
  }
}
