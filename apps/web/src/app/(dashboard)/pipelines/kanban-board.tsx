"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Plus, DollarSign, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

type Opp = {
  id: string; name: string; value?: string;
  status: string; stageId: string;
  contact: { id: string; firstName: string; lastName?: string };
};
type Stage = { id: string; name: string; color?: string; opportunities: Opp[] };
type Pipeline = { id: string; name: string; stages: Stage[] };

function OppCard({ opp, isDragging }: { opp: Opp; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: opp.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-background rounded-md border p-3 shadow-sm cursor-grab active:cursor-grabbing space-y-2 hover:shadow-md transition-shadow"
    >
      <p className="text-sm font-medium leading-snug">{opp.name}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {opp.contact.firstName} {opp.contact.lastName}
        </span>
        {opp.value && (
          <span className="flex items-center gap-0.5 font-medium text-foreground">
            <DollarSign className="h-3 w-3" />
            {Number(opp.value).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

function StageColumn({ stage }: { stage: Stage }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const oppIds = stage.opportunities.map((o) => o.id);

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {stage.color && (
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
          )}
          <span className="text-sm font-medium">{stage.name}</span>
          <Badge variant="secondary" className="text-xs">{stage.opportunities.length}</Badge>
        </div>
        <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors">
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 rounded-lg p-2 min-h-[120px] transition-colors ${isOver ? "bg-primary/5" : "bg-muted/40"}`}
      >
        <SortableContext items={oppIds} strategy={verticalListSortingStrategy}>
          {stage.opportunities.map((opp) => (
            <OppCard key={opp.id} opp={opp} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ pipelineId }: { pipelineId: string }) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken as string | undefined;
  const swrKey = `/v1/pipelines/${pipelineId}`;

  const { data, isLoading } = useSWR<{ pipeline: Pipeline }>(swrKey);
  const [activeOpp, setActiveOpp] = useState<Opp | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const opp = data?.pipeline.stages.flatMap((s) => s.opportunities).find((o) => o.id === event.active.id);
    if (opp) setActiveOpp(opp);
  }, [data]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveOpp(null);
    const { active, over } = event;
    if (!over || !data) return;

    const draggedOppId = active.id as string;
    const targetStageId = over.id as string;

    // Find current stage
    const currentStage = data.pipeline.stages.find((s) => s.opportunities.some((o) => o.id === draggedOppId));
    if (!currentStage || currentStage.id === targetStageId) return;

    // Optimistic update
    const optimistic = {
      pipeline: {
        ...data.pipeline,
        stages: data.pipeline.stages.map((s) => ({
          ...s,
          opportunities: s.id === currentStage.id
            ? s.opportunities.filter((o) => o.id !== draggedOppId)
            : s.id === targetStageId
              ? [...s.opportunities, { ...currentStage.opportunities.find((o) => o.id === draggedOppId)!, stageId: targetStageId }]
              : s.opportunities,
        })),
      },
    };

    await mutate(swrKey, optimistic, false);

    try {
      await api.post(`/v1/pipelines/${pipelineId}/opportunities/${draggedOppId}/move`, { stageId: targetStageId }, token);
    } finally {
      await mutate(swrKey);
    }
  }, [data, pipelineId, swrKey, token]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-16 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading board…
      </div>
    );
  }

  const stages = data?.pipeline.stages ?? [];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <StageColumn key={stage.id} stage={stage} />
        ))}
      </div>

      <DragOverlay>
        {activeOpp && <OppCard opp={activeOpp} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
