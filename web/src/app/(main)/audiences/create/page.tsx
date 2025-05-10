"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { AudienceRuleSet, IRuleGroup } from "@/models/campaign";

const defaultRuleGroup: IRuleGroup = {
  logicalOperator: "AND",
  conditions: [],
  groups: [],
};

export default function CreateAudiencePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // For simplicity, we'll use a JSON textarea for rules input
  const [rules, setRules] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState("");
  const [isGeneratingRules, setIsGeneratingRules] = useState(false);
  const [ruleJson, setRuleJson] = useState(JSON.stringify(defaultRuleGroup, null, 2)); 
  const [audienceRules, setAudienceRules] = useState<AudienceRuleSet>({ ...defaultRuleGroup });

  const router = useRouter();

  const handleGenerateRulesWithAI = async () => {
  if (!naturalLanguagePrompt.trim()) {
    toast("Please enter a prompt for the AI.");
    return;
  }
  setIsGeneratingRules(true);
  try {
    const response = await fetch("/api/ai/generate-segment-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: naturalLanguagePrompt }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to generate rules with AI.");
    }
    
    // Update all three states with the new rules
    setAudienceRules(data.rules);
    const formattedJson = JSON.stringify(data.rules, null, 2);
    setRuleJson(formattedJson);
    setRules(formattedJson); // Add this line to update the textarea
    
    toast.success("Audience rules generated and applied!");
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setIsGeneratingRules(false);
  }
};

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let parsedRules;
    try {
      parsedRules = JSON.parse(rules);
    } catch {
      setError("Rules must be valid JSON.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/audiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, rules: parsedRules }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message || "Failed to create audience segment.");
    } else {
      setSuccess("Audience segment created!");
      setTimeout(() => {
        router.push("/audiences");
      }, 1200);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-xl">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Audience Segment</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium" htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Segment Name"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="description">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe this segment (optional)"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="rules">
                Rules (JSON)
              </label>
              <Textarea
                id="rules"
                value={rules}
                onChange={e => setRules(e.target.value)}
                required
                rows={8}
                placeholder={`{
                  "logicalOperator": "AND",
                  "conditions": [
                    { "field": "totalSpends", "operator": "GREATER_THAN", "value": 1000 }
                  ]
                }`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter rules as JSON. See docs or ask admin for help.
              </p>
            </div>
            <div>
              <Label htmlFor="aiPrompt">Generate Audience Rules with AI</Label>
              <Input
                id="aiPrompt"
                value={naturalLanguagePrompt}
                onChange={(e) => setNaturalLanguagePrompt(e.target.value)}
                placeholder="e.g., customers who spent over 1000 and are inactive for 90 days"
              />
              <Button onClick={handleGenerateRulesWithAI} disabled={isGeneratingRules} className="mt-2">
                {isGeneratingRules ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Segment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}