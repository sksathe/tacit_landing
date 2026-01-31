import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Demos = () => {

  return (
    <section id="demos" className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl lg:text-5xl font-bold text-primary">
            Listen to Tacit Demos
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience how our AI agent naturally extracts and captures tacit knowledge through conversational sessions.
          </p>
        </div>

        <div className="flex justify-center max-w-2xl mx-auto">
          <Card className="hover-scale transition-smooth w-full">
            <CardHeader>
              <CardTitle className="text-xl">Payments Operations</CardTitle>
              <CardDescription>
                Scenario: Vikas a Payment Ops Manager speaks with AI-Payments Operations Analyst Racheal to help her understand Payments Operations setup in Advantage Bank.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Use Case(s):</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Ai-Assisted Process Discovery</Badge>
                  <Badge variant="secondary">AI-Assisted Onboarding</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Industry:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Management Consulting</Badge>
                  <Badge variant="secondary">B2B SaaS</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Listen to Demo:</p>
                <audio controls className="w-full">
                  <source src="/audio/vikas-racheal.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Demos;
