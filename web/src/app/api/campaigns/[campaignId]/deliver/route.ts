/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/campaigns/[campaignId]/deliver/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CampaignModel, { ICampaign } from '@/models/campaign';
import CustomerModel, { ICustomer } from '@/models/customer';
import CommunicationLogModel from '@/models/communicationLog';
import mongoose, { mongo } from 'mongoose';
import buildMongoQuery  from '@/lib/queryBuilder'; // Assuming you've moved buildMongoQuery to a reusable location
import { auth } from "@/auth";

// Helper function to personalize message (should be shared or imported)
function personalizeMessage(template: string, customer: ICustomer): string {
    return template
        .replace(/{{name}}/gi, customer.name)
        .replace(/{{email}}/gi, customer.email)
        .replace(/{{totalSpends}}/gi, String(customer.totalSpends))
        .replace(/{{visitCount}}/gi, String(customer.visitCount));
}

// Configuration for the Dummy Vendor API
const DUMMY_VENDOR_API_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/dummy-vendor/send`; // URL of your dummy vendor
const DELIVERY_RECEIPT_CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/delivery-receipts`;


export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { campaignId } = params;

  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    return NextResponse.json({ message: "Invalid Campaign ID format" }, { status: 400 });
  }

  try {
    await dbConnect();
    // TODO: Add authentication: Ensure user is authorized to trigger this campaign.
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const campaign = await CampaignModel.findById(campaignId);

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === 'SENDING' || campaign.status === 'COMPLETED') {
      return NextResponse.json(
        { message: `Campaign is already ${campaign.status.toLowerCase()} or has been completed.` },
        { status: 409 } // Conflict
      );
    }

    // Update campaign status to 'SENDING'
    campaign.status = 'SENDING';
    // Reset counts in case it's a retry, though a proper retry mechanism would be more complex
    campaign.sentCount = 0; 
    campaign.failedCount = 0;
    await campaign.save();

    // Fetch customers for the campaign's audience
    const mongoQuery = buildMongoQuery(campaign.audienceRules); // Use the shared query builder
    let customersInSegment: ICustomer[] = [];
    if (Object.keys(mongoQuery).length > 0) {
        customersInSegment = await CustomerModel.find(mongoQuery).lean();
    } else if (campaign.audienceRules.conditions.length === 0 && (!campaign.audienceRules.groups || campaign.audienceRules.groups.length === 0)) {
        // If no rules, target all customers (as per campaign creation logic)
        customersInSegment = await CustomerModel.find({}).lean();
    }


    if (customersInSegment.length === 0) {
      campaign.status = 'COMPLETED'; // Or 'FAILED' if no audience is an issue
      campaign.audienceSize = 0;
      await campaign.save();
      return NextResponse.json({ message: "No customers found in the audience. Campaign marked as completed.", campaign }, { status: 200 });
    }
    
    campaign.audienceSize = customersInSegment.length; // Update audience size if it changed
    await campaign.save();


    let successfullyInitiatedSends = 0;

    // Process each customer: Create log, call dummy vendor
    for (const customer of customersInSegment) {
      const personalizedMessageContent = personalizeMessage(campaign.messageTemplate, customer);

      // Create or update communication log
      // Using updateOne with upsert to avoid duplicates if this is re-triggered
      const logEntry = await CommunicationLogModel.findOneAndUpdate(
        { campaignId: campaign._id, customerId: customer._id },
        {
          $set: {
            message: personalizedMessageContent,
            status: 'PENDING', // Vendor will update to SENT/FAILED via callback
            sentAt: undefined, // Clear previous timestamps if any
            failedAt: undefined,
            failureReason: undefined,
            deliveredAt: undefined,
            vendorMessageId: undefined,
            createdBy: campaign.createdBy // or current user
          },
          $setOnInsert: { // Only set on creation
             campaignId: campaign._id, 
             customerId: customer._id,
             createdAt: new Date()
          }
        },
        { upsert: true, new: true } // Create if doesn't exist, return new doc
      );

      try {
        // Call the Dummy Vendor API
        // This is an asynchronous call; we don't wait for all of them to complete here.
        // The vendor will call our webhook.
        const vendorPayload = {
          customerId: customer._id.toString(),
          customerEmail: customer.email, // For vendor's use
          message: personalizedMessageContent,
          communicationLogId: logEntry._id.toString(), // For vendor to send back in receipt
          callbackUrl: DELIVERY_RECEIPT_CALLBACK_URL, // Our webhook for delivery receipts
        };

        // Fire-and-forget (don't await all calls in this loop for performance)
        // In a production system, you'd push this to a queue.
        fetch(DUMMY_VENDOR_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' /* Add any auth headers for vendor */ },
          body: JSON.stringify(vendorPayload),
        })
        .then(async vendorResponse => {
            if (!vendorResponse.ok) {
                const errorData = await vendorResponse.json().catch(() => ({message: "Unknown vendor error"}));
                console.error(`Dummy vendor API call failed for log ${logEntry._id}: ${vendorResponse.status}`, errorData.message);
                // If vendor call fails immediately, mark log as FAILED
                // This is a simplified immediate failure handling.
                // Robust systems rely on the callback or retry mechanisms.
                logEntry.status = 'FAILED';
                logEntry.failureReason = `Vendor API error: ${vendorResponse.status} - ${errorData.message || 'Failed to dispatch'}`;
                logEntry.failedAt = new Date();
                await logEntry.save();
                // Increment campaign failedCount (consider atomicity for these updates)
                await CampaignModel.updateOne({ _id: campaign._id }, { $inc: { failedCount: 1 } });
            } else {
                 // Vendor accepted the request, status remains PENDING until callback
                 console.log(`Message for log ${logEntry._id} dispatched to vendor.`);
            }
        })
        .catch(error => {
            console.error(`Network error calling dummy vendor API for log ${logEntry._id}:`, error);
            // Handle network error by marking log as FAILED
            logEntry.status = 'FAILED';
            logEntry.failureReason = `Network error: ${error.message}`;
            logEntry.failedAt = new Date();
            logEntry.save().then(() => {
                 CampaignModel.updateOne({ _id: campaign._id }, { $inc: { failedCount: 1 } }).catch(console.error);
            }).catch(console.error);
        });
        
        successfullyInitiatedSends++;

      } catch (e: any) {
        console.error(`Error during dispatch for customer ${customer._id}: ${e.message}`);
        // Log as FAILED if dispatch itself fails before calling vendor
        logEntry.status = 'FAILED';
        logEntry.failureReason = `Dispatch error: ${e.message}`;
        logEntry.failedAt = new Date();
        await logEntry.save();
        await CampaignModel.updateOne({ _id: campaign._id }, { $inc: { failedCount: 1 } });
      }
    }

    // Note: Campaign status to 'COMPLETED' should ideally be set when all callbacks are processed
    // or after a timeout. For now, we just indicate initiation.
    // The actual sent/failed counts will be updated by the delivery receipt webhook.

    return NextResponse.json(
      {
        message: `Campaign delivery process initiated for ${successfullyInitiatedSends} of ${customersInSegment.length} customers. Check logs for status.`,
        campaignId: campaign._id,
        initiatedSends: successfullyInitiatedSends,
        audienceSize: customersInSegment.length,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`Error triggering campaign delivery for ${campaignId}:`, error);
    // Attempt to revert campaign status if something went wrong badly
    const campaignToRevert = await CampaignModel.findById(campaignId);
    if (campaignToRevert && campaignToRevert.status === 'SENDING') {
        campaignToRevert.status = 'FAILED'; // Or back to 'DRAFT'/'SCHEDULED'
        await campaignToRevert.save();
    }
    return NextResponse.json({ message: "Failed to trigger campaign delivery", error: error.message }, { status: 500 });
  }
}
