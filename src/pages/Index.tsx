import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import Demos from "@/components/sections/Demos";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Demos />
      
      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 mx-auto text-center">
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold text-primary">
              Ready to capture your team's expertise?
            </h2>
            <p className="text-xl text-muted-foreground">
              Start your first knowledge extraction session today and transform tacit knowledge into structured learning assets.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow transition-smooth text-lg px-8"
                onClick={() => navigate("/setup-session")}
              >
                <Brain className="mr-2 h-5 w-5" />
                Start Knowledge Extraction
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8"
                onClick={() => navigate("/knowledge-library")}
              >
                <Users className="mr-2 h-5 w-5" />
                Browse Knowledge Library
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <div className="text-sm text-muted-foreground">Efficiency Gain</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">500+</div>
                <div className="text-sm text-muted-foreground">SMEs Trained</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-glow mb-2">10k+</div>
                <div className="text-sm text-muted-foreground">Hours Saved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Tacit-AI
              </span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-muted-foreground">
                © 2025 Tacit-AI. Transforming knowledge transfer through AI.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
