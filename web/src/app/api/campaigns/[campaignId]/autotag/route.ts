import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CampaignModel from '@/models/campaign';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  await dbConnect();
  const { campaignId } =await params;

  const campaign = await CampaignModel.findById(campaignId);
  if (!campaign) {
    return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
  }

  const { name, audienceRules, messageTemplate, status, audienceSize, sentCount, failedCount } = campaign;

  const prompt = `
You are an expert marketing strategist.

Based on the details of this campaign, suggest 1 to 3 appropriate high-level marketing tags that describe its purpose. Tags should be short, relevant, and reflect the strategy or objective (e.g., "Win-back", "Loyalty", "Reactivation", "Upsell", "Engagement").

Campaign Information:
- Name: ${name}
- Status: ${status}
- Audience Rules: ${JSON.stringify(audienceRules)}
- Message Template: "${messageTemplate}"
- Audience Size: ${audienceSize}
- Sent: ${sentCount}
- Failed: ${failedCount}

Respond only with a valid JSON array of strings, without explanations.
`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "user", content: prompt }
    ],
    model: "llama3-8b-8192",
    temperature: 0.3,
    max_tokens: 50,
  });

  let tags: string[] = [];
  try {
    const content = chatCompletion.choices[0]?.message?.content?.replace(/^```json|```$/g, '').trim();
    tags = JSON.parse(content || '[]');
  } catch {
    tags = [];
  }

  campaign.tags = tags;
  await campaign.save();

  return NextResponse.json({ tags });
}
