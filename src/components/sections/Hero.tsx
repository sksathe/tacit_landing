import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ArrowRight, Play, Users, Brain, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const heroImages = [
    {
      src: "/lovable-uploads/a7f7db26-29f2-4e58-90cb-952ab8607775.png",
      alt: "The Problem - Comic showing tacit knowledge locked in SME brains"
    },
    {
      src: "/lovable-uploads/04d335b8-715e-4e13-889a-9d3edeae0aec.png", 
      alt: "The Solution - Comic showing Tacit-AI helping capture knowledge through conversations"
    },
    {
      src: "/lovable-uploads/1838940c-9f12-4f52-b2bc-9a2d8706707f.png",
      alt: "The Value Delivered - Comic showing knowledge captured in guides, SOPs, FAQs, and training"
    }
  ];

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect();

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !isAutoPlaying) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000); // Change slide every 6 seconds (slower)

    return () => clearInterval(interval);
  }, [api, isAutoPlaying]);

  const handleDotClick = (index: number) => {
    if (!api) return;
    setIsAutoPlaying(false);
    api.scrollTo(index);
    
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-secondary opacity-40" />
      
      <div className="container relative px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Knowledge Extraction
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Capture {" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Tacit SME knowledge
                </span>{" "}
                and turn it into shared team intelligence.
              </h1>
              <h2> “Tacit knowledge lives in the minds of your top performers—unwritten, unseen, and hard to capture.” </h2>
              <p className="text-xl text-muted-foreground max-w-lg">
                Our AI agent acts like an intelligent trainee, engaging SMEs in natural conversations to surface and transform their expertise into lasting, actionable knowledge.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-floating transition-smooth text-lg px-8 text-primary-foreground shadow-floating animate-float"
                onClick={() => navigate("/dashboard")}
              >
                Start Extracting Knowledge
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                Listen to Tacit Demos
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Time Saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">SMEs Onboarded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Hours Extracted</div>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image Carousel */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <Carousel 
                setApi={setApi}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {heroImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <img 
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-auto"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
              
              {/* Dot Navigation */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      current === index 
                        ? 'bg-white shadow-lg scale-110' 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;