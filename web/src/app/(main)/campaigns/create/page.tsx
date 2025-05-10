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
import { useRouter } from "next/navigation"; // For redirecting
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Eye, Send } from "lucide-react";

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

  // --- Basic Rule Management Functions (Highly simplified) ---
  // In a real app, this would be a dynamic UI builder.
  // For this example, we'll allow editing a JSON representation of the rules.

  const handleRuleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRuleJson(e.target.value);
    try {
      const parsedRules = JSON.parse(e.target.value);
      setAudienceRules(parsedRules); // Basic validation, more robust needed
    } catch (error) {
      // console.error("Invalid JSON for rules");
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

          <div>
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
