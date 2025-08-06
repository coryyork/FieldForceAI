import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: "success-green" | "electric-blue" | "tech-cyan" | "neutral-grey";
}

export default function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: MetricCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "success-green":
        return "bg-green-100 text-green-600";
      case "electric-blue":
        return "bg-blue-100 text-blue-600";
      case "tech-cyan":
        return "bg-cyan-100 text-cyan-600";
      case "neutral-grey":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="app-card app-card-interactive">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-xl", getColorClasses(color))}>
            <Icon className="w-5 h-5" />
          </div>
          <div className={cn("text-xs font-medium", getChangeColor(changeType))}>
            {change}
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {title}
        </div>
      </div>
    </div>
  );
}
