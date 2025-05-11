/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/ai/suggest-messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Groq from 'groq-sdk';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import ratelimit from '@/lib/rateLimit';
import { redirect } from 'next/navigation';

const groqApiKey = process.env.GROQ_API_KEY;
let groq: Groq | null = null;

if (groqApiKey) {
  groq = new Groq({ apiKey: groqApiKey });
} else {
  console.warn("GROQ_API_KEY not found. AI features will be disabled for suggesting messages.");
}

const suggestMessagesRequestSchema = z.object({
  objective: z.string().min(10, "Campaign objective must be at least 10 characters long."),
  audienceDescription: z.string().optional(),
  tone: z.enum(['neutral', 'formal', 'friendly', 'playful', 'urgent']).optional().default('neutral'),
  messageCount: z.number().min(1).max(5).optional().default(3),
});

// Zod schema for validating the LLM's output for message suggestions
const messageSuggestionsResponseSchema = z.array(z.string());

// Helper function to construct the detailed prompt for the LLM
function getMessageSuggestionSystemPrompt(tone: string, count: number): string {
  return `You are an AI assistant that generates compelling marketing messages for campaigns.
    Your goal is to create ${count} distinct message variants.
    The messages should be concise, engaging, and tailored to the provided campaign objective and audience.
    The tone of the messages should be: ${tone}.
    Messages can use placeholders like {{name}}, {{email}}, {{totalSpends}}, {{visitCount}} for personalization.
    Your entire response must be a single JSON array of strings, where each string is a message suggestion.
    Example JSON output: ["Hi {{name}}, discover our new collection!", "Special offer for you, {{name}}!", "Don't miss out, {{name}}!"]
    Do NOT include any explanatory text outside of the JSON array.
    If you cannot generate appropriate messages, return an empty array [].
    `;
    }

export async function POST(request: NextRequest) {
  if (!groq) {
    return NextResponse.json({ message: "AI service not configured. GROQ_API_KEY missing." }, { status: 503 });
  }

  const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
  try {
    const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) return redirect("/too-fast");
    
    const body = await request.json();
    const validation = suggestMessagesRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid request body", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { objective, audienceDescription, tone, messageCount } = validation.data;
    const systemPrompt = getMessageSuggestionSystemPrompt(tone, messageCount);
    const userPrompt = `Campaign Objective: "${objective}"
${audienceDescription ? `Target Audience: "${audienceDescription}"` : ""}
Please generate ${messageCount} message suggestions with a ${tone} tone.`;

    console.log("Sending request to Groq for message suggestions...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "llama3-8b-8192", // Or "mixtral-8x7b-32768"
      temperature: 0.7, // Higher temperature for more creative message suggestions
      // response_format: { type: "json_object" }, // If model supports it and if you structure prompt to ask for {"suggestions": ["msg1", "msg2"]}
    });

    const llmResponseContent = chatCompletion.choices[0]?.message?.content;
    if (!llmResponseContent) {
      console.error("Groq response content for messages is empty or null.");
      return NextResponse.json({ message: "AI failed to generate message suggestions." }, { status: 500 });
    }

    console.log("Groq Raw Response (Messages):", llmResponseContent);

    let parsedSuggestions;
    try {
      // Attempt to parse the LLM response as JSON (expecting an array of strings)
      const cleanedJsonString = llmResponseContent.replace(/^```json\s*|```$/g, '').trim();
      parsedSuggestions = JSON.parse(cleanedJsonString);
    } catch (e) {
      console.error("Failed to parse LLM JSON response for messages:", e, "Raw response:", llmResponseContent);
      return NextResponse.json({ message: "AI generated an invalid JSON format for messages. Please try again.", rawError: llmResponseContent }, { status: 500 });
    }

    // Validate the parsed suggestions against our Zod schema
    const suggestionsValidation = messageSuggestionsResponseSchema.safeParse(parsedSuggestions);
    if (!suggestionsValidation.success) {
      console.error("LLM message output failed Zod validation:", suggestionsValidation.error.flatten());
      return NextResponse.json(
        {
          message: "AI generated message suggestions with an invalid structure.",
          errors: suggestionsValidation.error.flatten().fieldErrors,
          rawOutput: parsedSuggestions
        },
        { status: 500 }
      );
    }
    
    if (suggestionsValidation.data.length === 0) {
        return NextResponse.json({ message: "AI could not generate relevant message suggestions for the given objective. Try rephrasing." }, { status: 422 });
    }


    return NextResponse.json({ suggestions: suggestionsValidation.data }, { status: 200 });

  } catch (error: any) {
    console.error("Error in AI suggest-messages API:", error);
    let errorMessage = "Failed to suggest messages";
     if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message; // Groq specific error
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, error: error.toString() }, { status: 500 });
  }
}
