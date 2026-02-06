import { Card, CardContent } from "@/app/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: string;
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  gradient = "from-blue-500 to-purple-600"
}: FeatureCardProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
