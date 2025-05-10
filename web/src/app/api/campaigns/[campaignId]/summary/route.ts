import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CampaignModel from '@/models/campaign';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  await dbConnect();
  const { campaignId } =await params;

  const campaign = await CampaignModel.findById(campaignId);
  if (!campaign) {
    return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
  }

  const { sentCount, failedCount, audienceSize, name, messageTemplate } = campaign;

  const prompt = `
You are a marketing analytics assistant. Write a short, insightful summary of the following campaign's performance in a professional tone. Highlight what went well, what could be improved, and whether it achieved its goals.

Campaign Details:
- Name: ${name}
- Audience Size: ${audienceSize}
- Messages Sent Successfully: ${sentCount}
- Messages Failed: ${failedCount}
- Message Template: "${messageTemplate}"

Avoid technical jargon. The summary is for a marketing manager.
`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "user", content: prompt }
    ],
    model: "llama3-8b-8192",
    temperature: 0.4,
    max_tokens: 150,
  });

  const summary = chatCompletion.choices[0]?.message?.content || "No summary generated.";

  return NextResponse.json({ summary });
}
