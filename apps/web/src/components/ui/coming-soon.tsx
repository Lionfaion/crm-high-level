import { Construction } from "lucide-react";

export function ComingSoon({ module }: { module: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
      <Construction className="h-10 w-10 text-muted-foreground/40" />
      <div>
        <p className="font-medium text-foreground">{module}</p>
        <p className="text-sm text-muted-foreground mt-1">This module is coming soon.</p>
      </div>
    </div>
  );
}
