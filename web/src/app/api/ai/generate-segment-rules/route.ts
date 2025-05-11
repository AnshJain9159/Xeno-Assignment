/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/ai/generate-segment-rules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Groq from 'groq-sdk';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import ratelimit from '@/lib/rateLimit';
import { redirect } from 'next/navigation';

const ruleConditionSchema = z.object({
  field: z.enum(['totalSpends', 'visitCount', 'lastActiveDate', 'name', 'email']),
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'OLDER_THAN_DAYS', 'IN_LAST_DAYS']),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).transform(val => {
    // Attempt to convert to number if operator suggests numeric comparison
    // This is a basic heuristic; more robust type handling might be needed based on LLM output.
    if (typeof val === 'string' && ['GREATER_THAN', 'LESS_THAN', 'OLDER_THAN_DAYS', 'IN_LAST_DAYS'].includes(ruleConditionSchema.shape.operator._def.values[0])) {
        const num = parseFloat(val);
        if (!isNaN(num)) return num;
    }
    return val;
  }),
  dataType: z.enum(['string', 'number', 'date', 'boolean']).optional(),
});

// Recursive schema for rule groups
const baseRuleGroupSchema = z.object({
  logicalOperator: z.enum(['AND', 'OR']),
  conditions: z.array(ruleConditionSchema),
});

type RuleGroupInput = z.infer<typeof baseRuleGroupSchema> & {
  groups?: RuleGroupInput[];
};

const ruleGroupSchema: z.ZodType<RuleGroupInput> = baseRuleGroupSchema.extend({
  groups: z.lazy(() => z.array(ruleGroupSchema)).optional(),
});

// This is the Zod schema for the entire AudienceRuleSet structure.
// The LLM's JSON output MUST conform to this.
const audienceRuleSetZodSchema = ruleGroupSchema;
export type AudienceRuleSet = z.infer<typeof audienceRuleSetZodSchema>;

const groqApiKey = process.env.GROQ_API_KEY;
let groq: Groq | null = null;

if (groqApiKey) {
  groq = new Groq({ apiKey: groqApiKey });
} else {
  console.warn("GROQ_API_KEY not found. AI features will be disabled.");
}

const generateRulesRequestSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters long."),
  // You can add more context if needed, e.g., availableFields: ['totalSpends', 'visitCount', ...]
});

// Helper function to construct the detailed prompt for the LLM
function getRuleGenerationSystemPrompt(): string {
  const exampleRuleSet: AudienceRuleSet = {
    logicalOperator: "AND",
    conditions: [
      { field: "totalSpends", operator: "GREATER_THAN", value: 1000, dataType: "number" },
      { field: "lastActiveDate", operator: "OLDER_THAN_DAYS", value: 90, dataType: "date" }
    ],
    groups: [
      {
        logicalOperator: "OR",
        conditions: [
          { field: "email", operator: "CONTAINS", value: "@example.com", dataType: "string" }
        ],
        groups: []
      }
    ]
  };

  return `You are an AI assistant that converts natural language descriptions into JSON rule sets for customer segmentation.
        Your goal is to generate a valid JSON object that strictly adheres to the provided schema for an 'AudienceRuleSet'.

        The JSON structure is as follows:
        A top-level object with:
        - "logicalOperator": "AND" or "OR" (string, required)
        - "conditions": An array of condition objects (array, required, can be empty)
        - "groups": An array of nested rule group objects (array, optional, can be empty)

        Each condition object within the "conditions" array must have:
        - "field": One of ["totalSpends", "visitCount", "lastActiveDate", "name", "email"] (string, required)
        - "operator": One of ["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "STARTS_WITH", "ENDS_WITH", "OLDER_THAN_DAYS", "IN_LAST_DAYS"] (string, required)
        - "value": The value to compare against (string, number, or boolean, required). For date-based operators like "OLDER_THAN_DAYS" or "IN_LAST_DAYS", the value should be a number representing days.
        - "dataType": One of ["string", "number", "date", "boolean"] (string, optional, but highly recommended especially for dates and numbers to ensure correct parsing).

        Available fields and their typical data types:
        - "totalSpends": number (e.g., 10000, 50.75)
        - "visitCount": number (e.g., 3, 0)
        - "lastActiveDate": date (used with "OLDER_THAN_DAYS" or "IN_LAST_DAYS" where value is number of days)
        - "name": string (e.g., "John Doe")
        - "email": string (e.g., "user@example.com")

        Valid operators:
        - For numbers ("totalSpends", "visitCount"): EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN.
        - For dates ("lastActiveDate"):
            - OLDER_THAN_DAYS: value is a number (e.g., 90 for older than 90 days).
            - IN_LAST_DAYS: value is a number (e.g., 30 for active in the last 30 days).
        - For strings ("name", "email"): EQUALS, NOT_EQUALS, CONTAINS, STARTS_WITH, ENDS_WITH.

        Example of a valid JSON output:
        ${JSON.stringify(exampleRuleSet, null, 2)}

        If the prompt is ambiguous or cannot be translated into this specific JSON structure, respond with a JSON object: {"error": "Could not translate prompt accurately."}
        Do NOT include any explanatory text outside of the JSON response. Your entire response must be a single JSON object.
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
    const validation = generateRulesRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid prompt", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { prompt: userPrompt } = validation.data;
    const systemPrompt = getRuleGenerationSystemPrompt();

    console.log("Sending request to Groq for rule generation...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Convert the following natural language description into the specified JSON rule set format: "${userPrompt}"`,
        },
      ],
      model: "llama3-8b-8192", // Or "mixtral-8x7b-32768" or other models that support JSON well
      temperature: 0.2, // Lower temperature for more deterministic JSON output
      // response_format: { type: "json_object" }, // Enable if your Groq model version reliably supports it
    });

    const llmResponseContent = chatCompletion.choices[0]?.message?.content;
    if (!llmResponseContent) {
      console.error("Groq response content is empty or null.");
      return NextResponse.json({ message: "AI failed to generate a response." }, { status: 500 });
    }

    console.log("Groq Raw Response:", llmResponseContent);

    let parsedRules;
    try {
      // Attempt to parse the LLM response as JSON
      // Sometimes LLMs wrap JSON in ```json ... ```, try to strip it.
      const cleanedJsonString = llmResponseContent.replace(/^```json\s*|```$/g, '').trim();
      parsedRules = JSON.parse(cleanedJsonString);
    } catch (e) {
      console.error("Failed to parse LLM JSON response:", e, "Raw response:", llmResponseContent);
      return NextResponse.json({ message: "AI generated an invalid JSON format. Please try rephrasing your prompt.", rawError: llmResponseContent }, { status: 500 });
    }
    
    // Check if the LLM indicated an error
    if (parsedRules && parsedRules.error) {
        return NextResponse.json({ message: `AI could not translate prompt: ${parsedRules.error}` }, { status: 422 });
    }

    // Validate the parsed rules against our Zod schema
    const ruleValidation = audienceRuleSetZodSchema.safeParse(parsedRules);
    if (!ruleValidation.success) {
      console.error("LLM output failed Zod validation:", ruleValidation.error.flatten());
      return NextResponse.json(
        {
          message: "AI generated rules with an invalid structure. Please try again or refine your prompt.",
          errors: ruleValidation.error.flatten().fieldErrors,
          rawOutput: parsedRules // Send back what the LLM produced for debugging
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ rules: ruleValidation.data }, { status: 200 });

  } catch (error: any) {
    console.error("Error in AI generate-segment-rules API:", error);
    let errorMessage = "Failed to generate segment rules";
    if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error.message; // Groq specific error
    } else if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, error: error.toString() }, { status: 500 });
  }
}
