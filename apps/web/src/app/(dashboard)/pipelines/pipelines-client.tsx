"use client";

import useSWR from "swr";
import { useState } from "react";
import { Plus, Loader2, GitBranch } from "lucide-react";
import { useAccount } from "@/lib/account-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KanbanBoard } from "./kanban-board";

type Pipeline = { id: string; name: string; stages: any[] };

export function PipelinesClient() {
  const { activeAccount } = useAccount();
  const { data, isLoading } = useSWR<{ pipelines: Pipeline[] }>(
    activeAccount ? "/v1/pipelines" : null,
  );
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);

  const pipelines = data?.pipelines ?? [];
  const activePipeline = pipelines.find((p) => p.id === activePipelineId) ?? pipelines[0];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-16 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading pipelines…
      </div>
    );
  }

  if (!pipelines.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <GitBranch className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">No pipelines yet</p>
          <p className="text-sm text-muted-foreground">Create your first pipeline to start tracking deals.</p>
          <Button size="sm" className="mt-2 gap-1.5"><Plus className="h-4 w-4" /> New Pipeline</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Pipeline tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {pipelines.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePipelineId(p.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activePipeline?.id === p.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {p.name}
          </button>
        ))}
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Pipeline
        </Button>
      </div>

      {/* Kanban */}
      {activePipeline && (
        <KanbanBoard key={activePipeline.id} pipelineId={activePipeline.id} />
      )}
    </div>
  );
}
