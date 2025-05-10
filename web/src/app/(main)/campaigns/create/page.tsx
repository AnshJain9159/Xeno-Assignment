/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(main)/audiences/create/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"
import { AudienceRuleSet, IRuleCondition, IRuleGroup } from "@/models/campaign"; // Adjust path as needed
import { useRouter } from "next/navigation"; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Eye, Send } from "lucide-react";

// Default empty rule structure
const defaultRuleGroup: IRuleGroup = {
  logicalOperator: "AND",
  conditions: [],
  groups: [],
};

export default function CreateAudiencePage() {
  const router = useRouter();
  const [campaignName, setCampaignName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("Hi {{name}}, check out our new offers!");
  const [audienceRules, setAudienceRules] = useState<AudienceRuleSet>({ ...defaultRuleGroup });
  const [previewSize, setPreviewSize] = useState<number | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [ruleJson, setRuleJson] = useState(JSON.stringify(defaultRuleGroup, null, 2)); // For direct JSON editing
  const [isSuggestingMessages, setIsSuggestingMessages] = useState(false);
  const [suggestedMessagesList, setSuggestedMessagesList] = useState<string[]>([]);
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState("");
  const [isGeneratingRules, setIsGeneratingRules] = useState(false);

  // --- Basic Rule Management Functions (Highly simplified) ---
  const isValidRuleJson = () => {
    try {
      JSON.parse(ruleJson);
      return true;
    } catch (e) {
      toast("Invalid audience rule JSON.");
      return false;
    }
  };

  // In handleCreateCampaign:
  if (!isValidRuleJson()) return;

  const handleRuleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRuleJson(e.target.value);
    try {
      const parsedRules = JSON.parse(e.target.value);
      setAudienceRules(parsedRules); // Basic validation, more robust needed
    } catch (error) {
      console.error("Invalid JSON for rules");
      // Potentially show an error to the user
    }
  };
  
  // Example of adding a simple condition to the top-level group
  const addSampleCondition = () => {
    const newCondition: IRuleCondition = {
        field: "totalSpends",
        operator: "GREATER_THAN",
        value: 1000,
        dataType: "number"
    };
    setAudienceRules(prevRules => {
        const updatedRules = JSON.parse(JSON.stringify(prevRules)); // Deep copy
        updatedRules.conditions.push(newCondition);
        setRuleJson(JSON.stringify(updatedRules, null, 2));
        return updatedRules;
    });
  };


  const handlePreviewAudience = async () => {
    if (!audienceRules) {
      toast("Please define audience rules.");
      return;
    }
    setIsLoadingPreview(true);
    setPreviewSize(null);
    try {
      const response = await fetch("/api/audiences/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: audienceRules }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to preview audience");
      }
      setPreviewSize(data.audienceSize);
      toast(`Estimated audience size: ${data.audienceSize}` );
    } catch (error: any) {
      console.error("Preview error:", error);
      toast(error.message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !messageTemplate || !audienceRules) {
      toast("Please fill all fields and define rules.");
      return;
    }
    setIsLoadingCreate(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          audienceRules,
          messageTemplate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create campaign");
      }
      toast(`Success! Campaign "${data.campaign.name}" created.`);
      router.push("/campaigns"); // Redirect to campaign history page
    } catch (error: any) {
      console.error("Create campaign error:", error);
      toast(error.message);
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const handleSuggestMessages = async () => {
    // Use campaignName as objective, or add a dedicated field
    const objective = campaignName || "Engage customers"; 
    // Simple audience description for now, can be improved
    const audienceDesc = naturalLanguagePrompt || (Object.keys(audienceRules.conditions).length > 0 ? "current segment" : "all customers");
  
    setIsSuggestingMessages(true);
    try {
      const response = await fetch("/api/ai/suggest-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective, audienceDescription: audienceDesc }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to suggest messages.");
      }
      setSuggestedMessagesList(data.suggestions);
      // Open your dialog here to show suggestions
      toast("Messages suggested!");
    } catch (error: any) {
      toast(error.message);
    } finally {
      setIsSuggestingMessages(false);
    }
  };

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
      setAudienceRules(data.rules); // Assuming setAudienceRules updates your main rules state
      setRuleJson(JSON.stringify(data.rules, null, 2)); // Update the JSON textarea
      toast("Audience rules generated and applied!");
    } catch (error: any) {
      toast(error.message);
    } finally {
      setIsGeneratingRules(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Campaign</CardTitle>
          <CardDescription>Define your audience segment and craft your message.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Summer Sale for VIPs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messageTemplate">Message Template</Label>
            <Textarea
              id="messageTemplate"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Use {{name}}, {{email}} for personalization."
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Available placeholders: {"{{name}}"}, {"{{email}}"}, {"{{totalSpends}}"}, {"{{visitCount}}"}
            </p>
            <Button onClick={handleSuggestMessages} disabled={isSuggestingMessages}>
              {isSuggestingMessages ? "Generating..." : "Suggest Messages"}
            </Button>
            {suggestedMessagesList.length > 0 && (
              <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Suggested Messages:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {suggestedMessagesList.map((msg, idx) => (
                        <li key={idx} className="text-sm">{msg}</li>
                      ))}
                    </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="audienceRules">Audience Rules (JSON)</Label>
            <p className="text-sm text-muted-foreground">
              Define rules to segment your customers. Use fields like &apos;totalSpends&apos;, &apos;visitCount&apos;, &apos;lastActiveDate&apos;.
              Operators: &apos;EQUALS&apos;, &apos;NOT_EQUALS&apos;, &apos;GREATER_THAN&apos;, &apos;LESS_THAN&apos;, &apos;CONTAINS&apos;, &apos;OLDER_THAN_DAYS&apos;, &apos;IN_LAST_DAYS&apos;.
              Logical Operators for groups: &apos;AND&apos;, &apos;OR&apos;.
            </p>
            <Textarea
              id="audienceRules"
              value={ruleJson}
              onChange={handleRuleJsonChange}
              rows={10}
              placeholder='{ "logicalOperator": "AND", "conditions": [ { "field": "totalSpends", "operator": "GREATER_THAN", "value": 100 } ] }'
              className="font-mono text-sm"
            />
             <Button onClick={addSampleCondition} variant="outline" size="sm" className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Sample Spend Condition
            </Button>
            {/* <p className="text-xs text-muted-foreground mt-1">
                Example: `{"field"}: {"lastActiveDate", "operator": "OLDER_THAN_DAYS", "value": 90, "dataType": "date"}`
            </p> */}
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

          {previewSize !== null && (
            <p className="text-lg font-semibold">Estimated Audience Size: {previewSize}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
            <Button onClick={handlePreviewAudience} disabled={isLoadingPreview || isLoadingCreate} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              {isLoadingPreview ? "Previewing..." : "Preview Audience"}
            </Button>
            <Button onClick={handleCreateCampaign} disabled={isLoadingCreate || isLoadingPreview}>
              <Send className="mr-2 h-4 w-4" />
              {isLoadingCreate ? "Creating Campaign..." : "Save and Launch Campaign"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
