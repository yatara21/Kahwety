import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backHref?: string;
}

export function PageHeader({ title, subtitle, action, backHref }: PageHeaderProps) {
  return (
    <Card className="bg-white border-b-2 border-gold-500 rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {backHref && (
              <Link to={backHref}>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
