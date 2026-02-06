import { Check, X } from "lucide-react";
import { motion } from "motion/react";

interface ApprovalIndicatorProps {
  approvals: number;
  required: number;
  size?: "sm" | "md" | "lg";
}

export function ApprovalIndicator({ approvals, required, size = "md" }: ApprovalIndicatorProps) {
  const isComplete = approvals >= required;
  const nodes = Array.from({ length: required }, (_, i) => i);
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className="flex items-center space-x-2">
      {nodes.map((index) => {
        const isApproved = index < approvals;
        
        return (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div
              className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
                isApproved
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg"
                  : isComplete
                  ? "bg-gray-200 text-gray-400"
                  : "bg-purple-100 text-purple-400 border-2 border-purple-300 border-dashed"
              }`}
            >
              {isApproved ? (
                <Check className={iconSizes[size]} />
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
            {index < required - 1 && (
              <div
                className={`absolute left-full top-1/2 -translate-y-1/2 h-0.5 transition-all ${
                  size === "sm" ? "w-4" : size === "md" ? "w-6" : "w-8"
                } ${
                  isApproved
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : "bg-gray-200"
                }`}
              ></div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
