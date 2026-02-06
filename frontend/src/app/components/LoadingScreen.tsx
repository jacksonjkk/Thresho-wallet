import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="text-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative mx-auto mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-600 rounded-full blur-xl opacity-50"></div>
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
            <img src="/logo.png" alt="Thresho" className="w-24 h-24" />
          </div>
        </motion.div>
        
        <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
          Thresho
        </h2>
        
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading your secure wallet...</span>
        </div>
      </div>
    </div>
  );
}
