/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import type { AudienceRuleSet, IRuleGroup } from "@/models/campaign"
import { Wand2, ArrowLeft, Save, RefreshCw, HelpCircle, Code, MessageSquare, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users } from "lucide-react"
import { useSession } from "next-auth/react"

const defaultRuleGroup: IRuleGroup = {
  logicalOperator: "AND",
  conditions: [],
  groups: [],
}

export default function CreateAudiencePage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [rules, setRules] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState("")
  const [isGeneratingRules, setIsGeneratingRules] = useState(false)
  const [ruleJson, setRuleJson] = useState(JSON.stringify(defaultRuleGroup, null, 2))
  const [audienceRules, setAudienceRules] = useState<AudienceRuleSet>({ ...defaultRuleGroup })
  const [activeTab, setActiveTab] = useState("natural-language")
  const [estimatedAudienceSize, setEstimatedAudienceSize] = useState<number | null>(null)
  const [isCalculatingSize, setIsCalculatingSize] = useState(false)
  const { data: session, status } = useSession();
  const router = useRouter()
  
    useEffect(() => {
      if (status !== "authenticated") {
        toast.error("You must be signed in to view this page.")
        setTimeout(() => {
            router.push("/sign-in");
        }, 750);
        
      }
    }, [status]);

  const handleGenerateRulesWithAI = async () => {
    if (!naturalLanguagePrompt.trim()) {
      toast("Please enter a prompt for the AI.")
      return
    }
    setIsGeneratingRules(true)
    try {
      const response = await fetch("/api/ai/generate-segment-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: naturalLanguagePrompt }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate rules with AI.")
      }

      // Update all three states with the new rules
      setAudienceRules(data.rules)
      const formattedJson = JSON.stringify(data.rules, null, 2)
      setRuleJson(formattedJson)
      setRules(formattedJson) // Add this line to update the textarea
      setActiveTab("json-editor") // Switch to JSON editor tab to show the result

      toast.success("Audience rules generated and applied!")

      // Simulate audience size calculation
      calculateAudienceSize(data.rules)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsGeneratingRules(false)
    }
  }

  const calculateAudienceSize = async (rulesObj: any) => {
  setIsCalculatingSize(true);
  setEstimatedAudienceSize(null);
  try {
    const response = await fetch("/api/audiences/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules: rulesObj }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to preview audience size");
    }
    setEstimatedAudienceSize(
      typeof data.audienceSize === "number" ? data.audienceSize : 0
    );
  } catch (error) {
    console.error("Error calculating audience size:", error);
    toast.error("Failed to calculate audience size");
    setEstimatedAudienceSize(0);
  } finally {
    setIsCalculatingSize(false);
  }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    let parsedRules
    try {
      parsedRules = JSON.parse(rules)
    } catch {
      setError("Rules must be valid JSON.")
      toast.error("Rules must be valid JSON.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, rules: parsedRules }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create audience segment.")
      }

      setSuccess("Audience segment created successfully!")
      toast.success("Audience segment created successfully!")

      setTimeout(() => {
        router.push("/audiences")
      }, 1200)
    } catch (err: any) {
      setError(err.message || "Failed to create audience segment.")
      toast.error(err.message || "Failed to create audience segment.")
    } finally {
      setLoading(false)
    }
  }

  const examplePrompts = [
    "Customers who spent over $1000 in the last 3 months",
    "Inactive users who haven't made a purchase in 90 days",
    "High-value customers with more than 5 visits",
    "New customers who signed up in the last 30 days with at least one purchase",
  ]

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <Link
            href="/audiences"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Audience Segments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Users className="mr-2 h-8 w-8 text-primary" /> Create Audience Segment
          </h1>
          <p className="text-muted-foreground mt-1">Define a new audience segment for targeted campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segment Details</CardTitle>
              <CardDescription>Provide basic information about this audience segment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Segment Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., High-Value Customers"
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name that clearly identifies this audience
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Customers who have spent over $1000 in the last 3 months"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Add details about who is included in this segment and why it&apos;s useful
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Define Audience Rules</CardTitle>
              <CardDescription>Specify which customers should be included in this segment</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="natural-language" className="flex items-center gap-1">
                    <Wand2 className="h-4 w-4" /> Natural Language
                  </TabsTrigger>
                  <TabsTrigger value="json-editor" className="flex items-center gap-1">
                    <Code className="h-4 w-4" /> JSON Editor
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="natural-language" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="aiPrompt">Describe your audience in plain English</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p>
                              Describe the audience you want to target using natural language. Our AI will convert your
                              description into rules.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="aiPrompt"
                        value={naturalLanguagePrompt}
                        onChange={(e) => setNaturalLanguagePrompt(e.target.value)}
                        placeholder="e.g., customers who spent over $1000 and are inactive for 90 days"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleGenerateRulesWithAI}
                        disabled={isGeneratingRules || !naturalLanguagePrompt.trim()}
                        className="whitespace-nowrap"
                      >
                        {isGeneratingRules ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" /> Generate Rules
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-md border">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4 text-primary" /> Example Prompts
                    </h3>
                    <div className="space-y-2">
                      {examplePrompts.map((prompt, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-background rounded-md border cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setNaturalLanguagePrompt(prompt)}
                        >
                          &quot;{prompt}&quot;
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="json-editor" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rules">Rules (JSON Format)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p>
                              Define your audience rules in JSON format. The rules use logical operators (AND/OR) to
                              combine conditions based on customer attributes.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="rules"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      required
                      rows={10}
                      placeholder={`{
  "logicalOperator": "AND",
  "conditions": [
    { "field": "totalSpends", "operator": "GREATER_THAN", "value": 1000 }
  ]
}`}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter rules as JSON. Use the Natural Language tab to generate rules automatically.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert
                  variant="default"
                  className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                >
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading || !name || !rules} onClick={handleSubmit}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Create Segment
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audience Preview</CardTitle>
              <CardDescription>Estimated audience size based on current rules</CardDescription>
            </CardHeader>
            <CardContent>
              {estimatedAudienceSize !== null ? (
                <div className="text-center py-6">
                  <div className="text-4xl font-bold mb-2">{estimatedAudienceSize.toString()}</div>
                  <p className="text-sm text-muted-foreground">Estimated customers in this segment</p>
                  <div className="mt-4 flex justify-center">
                    <Badge variant="outline" className="text-xs">
                      Based on current data
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  {isCalculatingSize ? (
                    <>
                      <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">Calculating audience size...</p>
                    </>
                  ) : (
                    <>
                      <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Define your audience rules to see the estimated size
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => calculateAudienceSize(JSON.parse(rules || "{}"))}
                        disabled={!rules || isCalculatingSize}
                        className="mt-2"
                      >
                        Calculate Size
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Help & Tips</CardTitle>
              <CardDescription>Guidance for creating effective segments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Segment Naming</h3>
                <p className="text-sm text-muted-foreground">
                  Use clear, descriptive names that indicate the audience characteristics.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-1">Rule Creation</h3>
                <p className="text-sm text-muted-foreground">
                  Start with the Natural Language tab for easier rule generation, then fine-tune in the JSON Editor if
                  needed.
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-1">Available Fields</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>totalSpends - Total customer spending</li>
                  <li>visitCount - Number of visits/sessions</li>
                  <li>lastActiveDate - Date of last activity</li>
                  <li>email - Customer email address</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
