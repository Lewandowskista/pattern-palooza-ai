import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Cpu, PenTool, Download, ArrowRight, Scissors, Shirt, Sofa, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Upload, title: "Upload a Photo", description: "Snap a picture of any 3D object you want to replicate" },
  { icon: Cpu, title: "AI Analyzes", description: "Our AI breaks the object down into flat pattern pieces" },
  { icon: PenTool, title: "Edit & Refine", description: "Adjust dimensions, seam allowances, and labels interactively" },
  { icon: Download, title: "Download", description: "Export your pattern as a print-ready PDF" },
];

const examples = [
  { icon: Shirt, label: "Garments", desc: "Dresses, jackets, bags" },
  { icon: Sofa, label: "Upholstery", desc: "Cushions, covers, slipcovers" },
  { icon: BookOpen, label: "Leatherwork", desc: "Wallets, cases, accessories" },
  { icon: Scissors, label: "Paper & Foam", desc: "Models, packaging, crafts" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

const Index = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              AI-Powered Pattern Making
            </span>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6 max-w-4xl mx-auto">
              Turn any object into a{" "}
              <span className="text-primary">cutting pattern</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Upload a photo, and our AI generates editable 2D templates ready
              for fabric, leather, paper, or any material you work with.
            </p>
            <Link to="/upload">
              <Button size="lg" className="text-base px-8 py-6 rounded-xl gap-2 shadow-lg hover:shadow-xl transition-shadow">
                Start Creating <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-craft-tan/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto">
            From photo to pattern in four simple steps
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xs font-semibold text-craft-warm-gray uppercase tracking-wider mb-2">
                  Step {i + 1}
                </span>
                <h3 className="font-serif text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
            Built for Every Craft
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto">
            Whether you sew, upholster, or build, PatternCraft adapts to your discipline.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {examples.map((ex, i) => (
              <motion.div
                key={ex.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group p-6 rounded-2xl border border-border/50 bg-craft-linen hover:bg-secondary transition-colors cursor-default"
              >
                <ex.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-serif font-semibold text-lg mb-1">{ex.label}</h3>
                <p className="text-sm text-muted-foreground">{ex.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Ready to craft your first pattern?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sign up for free and start generating patterns in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-base px-8 py-6 rounded-xl gap-2">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/upload">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl">
                Try Without Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" />
            <span className="font-serif font-semibold">PatternCraft</span>
          </div>
          <span>AI-powered pattern making for every crafter</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
