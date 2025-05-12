import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, MessageSquare, Users, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full pt-12 pb-12 md:pt-24 md:pb-24 lg:pt-32 lg:pb-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background to-background"></div>
          <div className="container px-4 mx-auto md:px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-[800px] mx-auto animate-fade-in">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium mb-6 animate-slide-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Xeno SDE Internship Assignment – 2025
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl mb-6 text-primary">
                Intelligent Customer Relationship Management
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-[600px] mb-8">
                Segment customers, create personalized campaigns, and gain intelligent insights with our AI-powered CRM platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Link href="/campaigns" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-foreground border-border hover:bg-muted">
                  <Link href="api-docs" className="gap-2">
                    API Documentation <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-16 md:mt-24 flex justify-center">
              <div className="relative bg-card rounded-xl border shadow-xl overflow-hidden max-w-4xl w-full">
                <Image
                  src="/p1.jpg"
                  alt="CRM Dashboard"
                  width={1800}
                  height={500}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>
          </div>
          <ShootingStars />
        <StarsBackground/>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-16 lg:py-24">
          <div className="container px-4 mx-auto md:px-6">
            <div className="flex flex-col items-center text-center mb-12 md:mb-16">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight lg:text-5xl mb-4 text-foreground">
                Everything you need to manage customer relationships
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed">
                Our platform provides powerful tools to help you understand your customers, create targeted campaigns,
                and drive engagement.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Feature Cards */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                <CardContent className="p-6 md:p-8 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Customer Segmentation</h3>
                  <p className="text-muted-foreground mb-6">
                    Create flexible audience segments using powerful rule logic to target the right customers.
                  </p>
                  <ul className="space-y-2 text-sm text-left w-full">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Define complex conditions with AND/OR logic</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Preview audience size before saving</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Save segments for future campaigns</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                <CardContent className="p-6 md:p-8 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Campaign Delivery</h3>
                  <p className="text-muted-foreground mb-6">
                    Send personalized messages to your audience segments with real-time delivery tracking.
                  </p>
                  <ul className="space-y-2 text-sm text-left w-full">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Personalized messaging for each customer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Track delivery status in real-time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>View campaign history and performance</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                <CardContent className="p-6 md:p-8 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">AI-Powered Insights</h3>
                  <p className="text-muted-foreground mb-6">
                    Leverage artificial intelligence to gain deeper insights and optimize your campaigns.
                  </p>
                  <ul className="space-y-2 text-sm text-left w-full">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Natural language to segment rules conversion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>AI-driven message suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Smart scheduling recommendations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-1 border-none shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                <CardContent className="p-6 md:p-8 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Analytics Dashboard</h3>
                  <p className="text-muted-foreground mb-6">
                    Comprehensive analytics to measure campaign performance and customer engagement.
                  </p>
                  <ul className="space-y-2 text-sm text-left w-full">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Campaign performance metrics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Customer engagement tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>Actionable insights and recommendations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
          <ShootingStars />
        <StarsBackground/>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-20 lg:py-28 bg-muted/30">
          <div className="container px-4 mx-auto md:px-6">
            <div className="flex flex-col items-center text-center mb-12 md:mb-16">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
                How It Works
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight lg:text-5xl mb-4 text-foreground">
                Simple yet powerful workflow
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed">
                Our platform streamlines your customer relationship management with an intuitive process.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <div className="absolute top-0 right-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                    <Users className="h-3 w-3" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Define Your Audience</h3>
                <p className="text-muted-foreground">
                  Create targeted segments using flexible rule logic to identify the right customers for your campaigns.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <div className="absolute top-0 right-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                    <MessageSquare className="h-3 w-3" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Create Your Campaign</h3>
                <p className="text-muted-foreground">
                  Design personalized messages with AI assistance to maximize engagement and conversion rates.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <div className="absolute top-0 right-0 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                    <BarChart3 className="h-3 w-3" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Analyze Results</h3>
                <p className="text-muted-foreground">
                  Track campaign performance and gain actionable insights to continuously improve your strategies.
                </p>
              </div>
            </div>
          </div>
          <ShootingStars />
        <StarsBackground/>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-18 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="container px-4 mx-auto md:px-6 relative z-10">
            <div className="max-w-[800px] mx-auto bg-card rounded-xl border shadow-lg p-8 md:p-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-foreground">
                  Ready to transform your customer relationships?
                </h2>
                <p className="text-muted-foreground md:text-xl max-w-[600px]">
                  Get started with our CRM platform today and see the difference it can make for your business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Link href="/campaigns" className="gap-2">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <ShootingStars  />
        <StarsBackground starDensity={0.0002}/>
        </section>
        
      </main>
    </div>
  );
}