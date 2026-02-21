import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Shield, Users, Fingerprint, LogOut, ArrowRight, ChevronRight } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "motion/react";

interface WelcomePageProps {
  onNext: () => void;
}

export function WelcomePage({ onNext }: WelcomePageProps) {
  const { logout } = useAuth();

  const handleSkip = async () => {
    await logout();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>

          <CardHeader className="text-center space-y-6 pt-12 pb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150"></div>
                <div className="bg-black/40 rounded-3xl p-4 border border-white/10 relative z-10">
                  <img src="/logo.png" alt="Thresho" className="w-20 h-20 sm:w-24 sm:h-24" />
                </div>
              </div>
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-4xl sm:text-5xl font-bold tracking-tighter" style={{ fontFamily: 'var(--font-serif)' }}>
                Welcome to <span className="text-primary italic">Thresho</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-primary/70">
                Secure shared wallet for your team
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-10 px-6 sm:px-12 pb-12">
            <div className="grid gap-6">
              {[
                {
                  icon: Shield,
                  title: "Team Security",
                  desc: "Protect your funds through shared control. Every major action requires approval from your trusted circle.",
                  color: "text-primary",
                  bg: "bg-primary/10",
                  border: "border-primary/20"
                },
                {
                  icon: Users,
                  title: "Shared Management",
                  desc: "Easily manage money with team members or family. No single person has total control—it's a team effort.",
                  color: "text-blue-400",
                  bg: "bg-blue-400/10",
                  border: "border-blue-400/20"
                },
                {
                  icon: Fingerprint,
                  title: "Full Control",
                  desc: "You own your keys and your data. Connect your own wallet and set the rules for who can spend.",
                  color: "text-cyan-400",
                  bg: "bg-cyan-400/10",
                  border: "border-cyan-400/20"
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="flex gap-5 group/item cursor-default"
                >
                  <div className="flex-shrink-0">
                    <div className={`flex items-center justify-center h-14 w-14 rounded-2xl ${feature.bg} border ${feature.border} transition-transform group-hover/item:scale-110 duration-500`}>
                      <feature.icon className={`h-7 w-7 ${feature.color}`} />
                    </div>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-bold text-lg tracking-tight text-white group-hover/item:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <Button
                onClick={onNext}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                onClick={handleSkip}
                variant="ghost"
                className="w-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-white hover:bg-white/5"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Return to login
              </Button>
            </div>

            <div className="text-center">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-30">
                Secure Encryption • Team Approvals • Full Control
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
