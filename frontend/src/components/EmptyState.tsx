import { Coffee } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 border-2 border-dashed border-muted rounded-xl">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted/50">
        {icon ?? <Coffee className="h-8 w-8 text-muted-foreground" />}
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
