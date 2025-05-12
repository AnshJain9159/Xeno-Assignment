/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { AudienceRuleSet, IRuleCondition, IRuleGroup } from "@/models/campaign"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PlusCircle,
  Eye,
  Send,
  ArrowLeft,
  Wand2,
  Code,
  RefreshCw,
  MessageSquare,
  HelpCircle,
  Sparkles,
  BarChart2,
  CheckCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useSession } from "next-auth/react"
// Default empty rule structure
const defaultRuleGroup: IRuleGroup = {
  logicalOperator: "AND",
  conditions: [],
  groups: [],
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [campaignName, setCampaignName] = useState("")
  const [messageTemplate, setMessageTemplate] = useState("Hi {{name}}, check out our new offers!")
  const [audienceRules, setAudienceRules] = useState<AudienceRuleSet>({ ...defaultRuleGroup })
  const [previewSize, setPreviewSize] = useState<number | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isLoadingCreate, setIsLoadingCreate] = useState(false)
  const [ruleJson, setRuleJson] = useState(JSON.stringify(defaultRuleGroup, null, 2)) // For direct JSON editing
  const [isSuggestingMessages, setIsSuggestingMessages] = useState(false)
  const [suggestedMessagesList, setSuggestedMessagesList] = useState<string[]>([])
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState("")
  const [isGeneratingRules, setIsGeneratingRules] = useState(false)
  const [activeTab, setActiveTab] = useState("natural-language")
  const [activeMessageTab, setActiveMessageTab] = useState("template")
  const [messageGenerationProgress, setMessageGenerationProgress] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState("")
  const { data: session, status } = useSession();
  // const router = useRouter()
  
    useEffect(() => {
      if (status !== "authenticated") {
        toast.error("You must be signed in to view this page.")
        setTimeout(() => {
            router.push("/sign-in");
        }, 750);
        
      }
    }, [status,router]);
  // Effect to load segment rules if segmentId is in URL
  useEffect(() => {
    const segmentId = searchParams.get("segmentId")
    if (segmentId) {
      const fetchSegmentRules = async () => {
        try {
          toast.info("Loading rules from selected segment...")
          const response = await fetch(`/api/audiences/${segmentId}`)
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.message || "Failed to fetch segment rules")
          }
          if (data.audienceSegment && data.audienceSegment.rules) {
            setAudienceRules(data.audienceSegment.rules)
            setRuleJson(JSON.stringify(data.audienceSegment.rules, null, 2))
            setActiveTab("json-editor") // Switch to JSON editor
            toast.success("Audience rules loaded from segment!")
          } else {
            toast.error("Segment data is missing rules.")
          }
        } catch (error: any) {
          console.error("Error fetching segment rules:", error)
          toast.error(error.message || "Could not load segment rules.")
        }
      }
      fetchSegmentRules()
    }
  }, [searchParams]) // Re-run if searchParams change

  // --- Basic Rule Management Functions ---
  const isValidRuleJson = () => {
    try {
      JSON.parse(ruleJson)
      return true
    } catch (e) {
      toast.error("Invalid audience rule JSON.")
      return false
    }
  }

  const handleRuleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRuleJson(e.target.value)
    try {
      const parsedRules = JSON.parse(e.target.value)
      setAudienceRules(parsedRules)
    } catch (error) {
      console.error("Invalid JSON for rules")
      // We don't show an error here to allow for partial editing
    }
  }

  // Example of adding a simple condition to the top-level group
  const addSampleCondition = () => {
    const newCondition: IRuleCondition = {
      field: "totalSpends",
      operator: "GREATER_THAN",
      value: 1000,
      dataType: "number",
    }
    setAudienceRules((prevRules) => {
      const updatedRules = JSON.parse(JSON.stringify(prevRules)) // Deep copy
      updatedRules.conditions.push(newCondition)
      setRuleJson(JSON.stringify(updatedRules, null, 2))
      return updatedRules
    })
    toast.success("Sample condition added")
  }

  const handlePreviewAudience = async () => {
    if (!isValidRuleJson()) return

    setIsLoadingPreview(true)
    setPreviewSize(null)
    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would be an actual API call
      const response = await fetch("/api/audiences/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: audienceRules }),
      });
      const data = await response.json();
      console.log("Preview response:", data)
      if (!response.ok) {
        throw new Error(data.message || "Failed to preview audience");
      }

      // For demo purposes, generate a random audience size
      // const randomSize = Math.floor(Math.random() * 10000) + 500
      setPreviewSize(typeof data.audienceSize === "number" ? data.audienceSize : 0) // Use the size from the API response
      toast.success(`Estimated audience size: ${data.audienceSize}`)
    } catch (error: any) {
      console.error("Preview error:", error)
      toast.error(error.message)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!campaignName) {
      toast.error("Please enter a campaign name.")
      return
    }

    if (!messageTemplate) {
      toast.error("Please enter a message template.")
      return
    }

    if (!isValidRuleJson()) return

    setIsLoadingCreate(true)
    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, this would be an actual API call
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

      toast.success(`Success! Campaign "${campaignName}" created.`)
      router.push("/campaigns") // Redirect to campaign history page
    } catch (error: any) {
      console.error("Create campaign error:", error)
      toast.error(error.message)
    } finally {
      setIsLoadingCreate(false)
    }
  }

  const simulateProgress = (setProgressFn: React.Dispatch<React.SetStateAction<number>>, duration = 2000) => {
    setProgressFn(0)
    const interval = 30
    const steps = duration / interval
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const newProgress = Math.min(Math.floor((currentStep / steps) * 100), 95)
      setProgressFn(newProgress)
      if (currentStep >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }

  const handleSuggestMessages = async () => {
    // Use campaignName as objective, or add a dedicated field
    const objective = campaignName || "Engage customers"
    // Simple audience description for now, can be improved
    const audienceDesc =
      naturalLanguagePrompt || (Object.keys(audienceRules.conditions).length > 0 ? "current segment" : "all customers")

    setIsSuggestingMessages(true)
    setMessageGenerationProgress(0)
    setSuggestedMessagesList([])

    // Simulate progress
    const clearProgressSimulation = simulateProgress(setMessageGenerationProgress)

    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, this would be an actual API call
      // const response = await fetch("/api/ai/suggest-messages", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ objective, audienceDescription: audienceDesc }),
      // });
      // const data = await response.json();
      // if (!response.ok) {
      //   throw new Error(data.message || "Failed to suggest messages.");
      // }

      // For demo purposes, generate some sample messages
      const sampleMessages = [
        `Hi {{name}}, we noticed you've been with us for a while! Check out our exclusive offers just for loyal customers like you.`,
        `{{name}}, as one of our valued customers, we'd like to offer you 15% off your next purchase. Use code LOYAL15 at checkout!`,
        `Hello {{name}}! We miss you - it's been a while since your last visit. Come back and enjoy a special discount on your favorite items.`,
        `{{name}}, thank you for being a loyal customer! We've prepared some special offers we think you'll love. Check them out now!`,
      ]

      setMessageGenerationProgress(100)
      setSuggestedMessagesList(sampleMessages)
      setActiveMessageTab("suggestions")
      toast.success("Messages generated successfully!")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      clearProgressSimulation()
      setTimeout(() => setIsSuggestingMessages(false), 500) // Give time for progress to complete
    }
  }

  const handleGenerateRulesWithAI = async () => {
    if (!naturalLanguagePrompt.trim()) {
      toast.error("Please enter a prompt for the AI.")
      return
    }
    setIsGeneratingRules(true)
    try {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would be an actual API call
      // const response = await fetch("/api/ai/generate-segment-rules", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ prompt: naturalLanguagePrompt }),
      // });
      // const data = await response.json();
      // if (!response.ok) {
      //   throw new Error(data.message || "Failed to generate rules with AI.");
      // }

      // For demo purposes, generate a sample rule based on the prompt
      const sampleRule = { ...defaultRuleGroup }

      if (naturalLanguagePrompt.toLowerCase().includes("spent over")) {
        sampleRule.conditions.push({
          field: "totalSpends",
          operator: "GREATER_THAN",
          value: 1000,
          dataType: "number",
        })
      }

      if (
        naturalLanguagePrompt.toLowerCase().includes("inactive") ||
        naturalLanguagePrompt.toLowerCase().includes("days")
      ) {
        sampleRule.conditions.push({
          field: "lastActiveDate",
          operator: "OLDER_THAN_DAYS",
          value: 90,
          dataType: "date",
        })
      }

      if (naturalLanguagePrompt.toLowerCase().includes("visit")) {
        sampleRule.conditions.push({
          field: "visitCount",
          operator: "GREATER_THAN",
          value: 5,
          dataType: "number",
        })
      }

      setAudienceRules(sampleRule)
      setRuleJson(JSON.stringify(sampleRule, null, 2))
      setActiveTab("json-editor") // Switch to JSON editor tab to show the result
      toast.success("Audience rules generated and applied!")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsGeneratingRules(false)
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
            href="/campaigns"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Campaigns
          </Link>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Send className="mr-2 h-8 w-8 text-primary" /> Create New Campaign
          </h1>
          <p className="text-muted-foreground mt-1">
            Define your audience, craft your message, and launch your campaign
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Provide basic information about this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Summer Sale for VIPs"
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name that clearly identifies this campaign
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Template</CardTitle>
              <CardDescription>Craft the message that will be sent to your audience</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeMessageTab} onValueChange={setActiveMessageTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="template" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" /> Template Editor
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" /> AI Suggestions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="template" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="messageTemplate">Message Content</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p>
                              Use placeholders like {"{{name}}"} to personalize your message for each recipient. These
                              will be replaced with actual customer data.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="messageTemplate"
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      placeholder="Use {{name}}, {{email}} for personalization."
                      rows={5}
                    />
                    <div className="bg-muted/30 p-3 rounded-md border">
                      <p className="text-sm font-medium mb-1">Available Placeholders:</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-background">
                          {"{{name}}"}
                        </Badge>
                        <Badge variant="outline" className="bg-background">
                          {"{{email}}"}
                        </Badge>
                        <Badge variant="outline" className="bg-background">
                          {"{{totalSpends}}"}
                        </Badge>
                        <Badge variant="outline" className="bg-background">
                          {"{{visitCount}}"}
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={handleSuggestMessages} disabled={isSuggestingMessages} className="w-full mt-2">
                      {isSuggestingMessages ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" /> Generate Message Suggestions
                        </>
                      )}
                    </Button>
                    {isSuggestingMessages && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Generating suggestions...</span>
                          <span>{messageGenerationProgress}%</span>
                        </div>
                        <Progress value={messageGenerationProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4">
                  {suggestedMessagesList.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Select a message template from the AI-generated suggestions below:
                      </p>
                      <div className="space-y-3">
                        {suggestedMessagesList.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-md border cursor-pointer transition-colors ${
                              selectedMessage === msg
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50 bg-muted/20"
                            }`}
                            onClick={() => {
                              setSelectedMessage(msg)
                              setMessageTemplate(msg)
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <p className="text-sm">{msg}</p>
                              {selectedMessage === msg && (
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveMessageTab("template")
                        }}
                        className="w-full"
                      >
                        Continue Editing Selected Template
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No message suggestions generated yet</p>
                      <Button onClick={handleSuggestMessages} className="mt-4" disabled={isSuggestingMessages}>
                        {isSuggestingMessages ? "Generating..." : "Generate Suggestions"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Define Audience Rules</CardTitle>
              <CardDescription>Specify which customers should receive this campaign</CardDescription>
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
                      <Label htmlFor="audienceRules">Rules (JSON Format)</Label>
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
                      id="audienceRules"
                      value={ruleJson}
                      onChange={handleRuleJsonChange}
                      rows={10}
                      placeholder='{ "logicalOperator": "AND", "conditions": [ { "field": "totalSpends", "operator": "GREATER_THAN", "value": 100 } ] }'
                      className="font-mono text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={addSampleCondition} variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Sample Condition
                      </Button>
                      <Button onClick={handlePreviewAudience} variant="outline" size="sm" disabled={isLoadingPreview}>
                        <Eye className="mr-2 h-4 w-4" />
                        {isLoadingPreview ? "Calculating..." : "Preview Audience Size"}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-md border">
                    <p className="text-sm font-medium mb-1">Available Fields & Operators:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <div>
                        <p className="font-medium">Fields:</p>
                        <ul className="list-disc list-inside">
                          <li>totalSpends - Total customer spending</li>
                          <li>visitCount - Number of visits/sessions</li>
                          <li>lastActiveDate - Date of last activity</li>
                          <li>email - Customer email address</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium">Operators:</p>
                        <ul className="list-disc list-inside">
                          <li>EQUALS, NOT_EQUALS</li>
                          <li>GREATER_THAN, LESS_THAN</li>
                          <li>CONTAINS</li>
                          <li>OLDER_THAN_DAYS, IN_LAST_DAYS</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Summary</CardTitle>
              <CardDescription>Review your campaign before launching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Campaign Name</h3>
                <p className="text-sm bg-muted/30 p-2 rounded-md">
                  {campaignName || <span className="text-muted-foreground italic">Not set</span>}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-1">Message Preview</h3>
                <div className="bg-muted/30 p-3 rounded-md border">
                  <p className="text-sm whitespace-pre-wrap">
                    {messageTemplate || <span className="text-muted-foreground italic">No message template</span>}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium mb-1">Audience Size</h3>
                  {isLoadingPreview && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                </div>
                {previewSize !== null ? (
              <div className="text-center py-4">
                <div className="text-3xl font-bold mb-1">{typeof previewSize === "number" ? previewSize.toString() : "0"}</div>
                <p className="text-xs text-muted-foreground">Estimated recipients</p>
              </div>
            ) : (
              <div className="text-center py-4 bg-muted/20 rounded-md border border-dashed">
                <BarChart2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click &quot;Preview Audience Size&quot; to calculate</p>
              </div>
            )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                onClick={handleCreateCampaign}
                disabled={isLoadingCreate || isLoadingPreview}
                className="w-full"
                size="lg"
              >
                {isLoadingCreate ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Creating Campaign...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Save and Launch Campaign
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will save your campaign and prepare it for delivery to the selected audience.
              </p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Checklist</CardTitle>
              <CardDescription>Ensure your campaign is ready to launch</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      campaignName
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {campaignName ? <CheckCircle className="h-3 w-3" /> : "1"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Set a descriptive campaign name</p>
                    <p className="text-xs text-muted-foreground">
                      Choose a name that clearly identifies the purpose of this campaign
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      messageTemplate
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {messageTemplate ? <CheckCircle className="h-3 w-3" /> : "2"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Create a message template</p>
                    <p className="text-xs text-muted-foreground">
                      Craft a personalized message that will resonate with your audience
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      audienceRules.conditions.length > 0
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {audienceRules.conditions.length > 0 ? <CheckCircle className="h-3 w-3" /> : "3"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Define audience rules</p>
                    <p className="text-xs text-muted-foreground">
                      Specify which customers should receive this campaign
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      previewSize !== null
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {previewSize !== null ? <CheckCircle className="h-3 w-3" /> : "4"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Preview audience size</p>
                    <p className="text-xs text-muted-foreground">Check how many customers will receive your campaign</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
