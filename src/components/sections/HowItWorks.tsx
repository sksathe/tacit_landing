import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, MessageCircle, FileOutput, Search } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Setup & Invitation",
      description: "L&D Associate or SME creates a session and invites participants. Our AI agent configures its persona based on the knowledge extraction context.",
      color: "text-primary"
    },
    {
      icon: MessageCircle,
      step: "02", 
      title: "AI-Guided Conversation",
      description: "SME engages in natural conversation with the AI agent, which asks intelligent questions and adapts its approach based on responses.",
      color: "text-accent"
    },
    {
      icon: FileOutput,
      step: "03",
      title: "Automated Synthesis",
      description: "The platform automatically structures the conversation into learning assets: guides, FAQs, quizzes, and course modules.",
      color: "text-primary-glow"
    },
    {
      icon: Search,
      step: "04",
      title: "Knowledge Library",
      description: "Generated content is stored in a searchable library with tagging and categorization for easy access by team members.",
      color: "text-primary"
    }
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container px-4 mx-auto">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
            <ArrowRight className="w-4 h-4 mr-2" />
            How It Works
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold">
            From conversation to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              structured knowledge
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered process transforms tacit knowledge into actionable learning assets in just four simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="h-full border-0 shadow-elegant hover:shadow-glow transition-smooth group">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="relative">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4`}>
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              
              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 border-0 shadow-elegant bg-gradient-to-br from-primary/5 to-primary-glow/5">
            <h3 className="text-2xl font-bold mb-4">Scenario 1: Urgent Documentation</h3>
            <p className="text-muted-foreground">
              L&D Associate identifies a knowledge gap and needs to establish reference SOPs from the most experienced SME. They set up a Tacit-AI session and invite the SME to share their expertise.
            </p>
          </Card>

          <Card className="p-8 border-0 shadow-elegant bg-gradient-to-br from-accent/5 to-primary/5">
            <h3 className="text-2xl font-bold mb-4">Scenario 2: SME Self-Service</h3>
            <p className="text-muted-foreground">
              SME is overwhelmed with repetitive help requests from colleagues. They proactively create a knowledge extraction session to document their expertise and reduce future interruptions.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;