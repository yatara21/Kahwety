import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "gold" | "green" | "blue" | "red" | "purple";
}

const colorClasses: Record<string, string> = {
  gold: "bg-gold-100 text-gold-600",
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
};

const trendColors: Record<string, string> = {
  up: "text-green-600",
  down: "text-red-600",
  neutral: "text-muted-foreground",
};

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  trendValue,
  color = "gold",
}: StatCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-ink-900 mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && trendValue && (
              <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trendColors[trend])}>
                <TrendIcon className="h-3 w-3" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={cn("flex items-center justify-center h-12 w-12 rounded-full shrink-0", colorClasses[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
