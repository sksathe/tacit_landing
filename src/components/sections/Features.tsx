import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, FileText, Search, Video, Share2, Brain, Zap, Users } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Agent as Trainee",
      description: "Our intelligent AI agent adapts different personas to naturally extract knowledge from SMEs through conversational interactions.",
      gradient: "from-primary to-primary-glow"
    },
    {
      icon: MessageSquare,
      title: "Adaptive Questioning",
      description: "Dynamic questioning that adjusts based on responses, identifying knowledge gaps and seeking clarification in real-time.",
      gradient: "from-primary-glow to-accent"
    },
    {
      icon: FileText,
      title: "Automated Structuring",
      description: "Transform unstructured conversations into logical hierarchies with summaries, guides, FAQs, and learning modules.",
      gradient: "from-secondary to-primary"
    },
    {
      icon: Search,
      title: "Searchable Knowledge Library",
      description: "Central repository with tagging, categorization, and version control for all captured knowledge assets.",
      gradient: "from-primary to-accent"
    },
    {
      icon: Share2,
      title: "Multi-Format Content",
      description: "Generate various learning assets including written guides, audio snippets, quizzes, and structured courses.",
      gradient: "from-accent to-primary-glow"
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Brain className="w-4 h-4 mr-2" />
            Core Features
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold">
            Everything you need to capture{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              tacit knowledge
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From conversation to structured learning assets, our platform handles the entire knowledge extraction and synthesis process.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-elegant hover:shadow-floating transition-smooth group focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-smooth`} />
              <CardHeader className="relative">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-glow`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-8 bg-card p-6 rounded-2xl shadow-floating animate-float">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">500+ SMEs</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">10k+ Hours Extracted</span>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary-glow" />
              <span className="text-sm font-medium">95% Accuracy</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;