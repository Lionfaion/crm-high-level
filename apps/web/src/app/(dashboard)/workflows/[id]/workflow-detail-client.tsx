"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Play, Trash2, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Step {
  id: string;
  position: number;
  actionType: string;
  config: Record<string, unknown>;
}

interface Workflow {
  id: string;
  name: string;
  triggerType: string;
  status: string;
  steps: Step[];
}

const ACTION_TYPES = [
  "SEND_EMAIL", "SEND_SMS", "ADD_TAG", "REMOVE_TAG", "WAIT",
  "WEBHOOK", "UPDATE_CONTACT", "INTERNAL_NOTE",
];

const ACTION_LABELS: Record<string, string> = {
  SEND_EMAIL:      "Send Email",
  SEND_SMS:        "Send SMS",
  ADD_TAG:         "Add Tag",
  REMOVE_TAG:      "Remove Tag",
  WAIT:            "Wait / Delay",
  WEBHOOK:         "Webhook",
  UPDATE_CONTACT:  "Update Contact",
  INTERNAL_NOTE:   "Internal Note",
};

const ACTION_COLORS: Record<string, string> = {
  SEND_EMAIL:     "bg-blue-100 text-blue-700",
  SEND_SMS:       "bg-purple-100 text-purple-700",
  ADD_TAG:        "bg-green-100 text-green-700",
  REMOVE_TAG:     "bg-red-100 text-red-700",
  WAIT:           "bg-yellow-100 text-yellow-700",
  WEBHOOK:        "bg-orange-100 text-orange-700",
  UPDATE_CONTACT: "bg-teal-100 text-teal-700",
  INTERNAL_NOTE:  "bg-gray-100 text-gray-700",
};

export function WorkflowDetailClient({ id }: { id: string }) {
  const [addOpen, setAddOpen]     = useState(false);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [newAction, setNewAction] = useState({ actionType: "SEND_EMAIL", config: {} as any });
  const [running, setRunning]     = useState(false);
  const [contactId, setContactId] = useState("");

  const { data, mutate } = useSWR<{ workflow: Workflow }>(
    `/v1/workflows/${id}`,
    () => api.get(`/v1/workflows/${id}`)
  );

  const workflow = data?.workflow;

  async function addStep() {
    try {
      await api.post(`/v1/workflows/${id}/steps`, newAction);
      toast.success("Step added");
      setAddOpen(false);
      setNewAction({ actionType: "SEND_EMAIL", config: {} });
      mutate();
    } catch {
      toast.error("Failed to add step");
    }
  }

  async function deleteStep(stepId: string) {
    try {
      await api.delete(`/v1/workflows/${id}/steps/${stepId}`);
      toast.success("Step removed");
      mutate();
    } catch {
      toast.error("Failed to remove step");
    }
  }

  async function toggleActive() {
    if (!workflow) return;
    const newStatus = workflow.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await api.patch(`/v1/workflows/${id}`, { status: newStatus });
      toast.success(`Workflow ${newStatus === "ACTIVE" ? "activated" : "paused"}`);
      mutate();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function triggerManually() {
    setRunning(true);
    try {
      const result = await api.post<{ runId: string }>(`/v1/workflows/${id}/trigger`, {
        contactId: contactId || undefined,
        triggeredBy: "manual",
      });
      toast.success(`Workflow started — run ${result.runId.slice(0, 8)}`);
      setTriggerOpen(false);
      setContactId("");
    } catch {
      toast.error("Failed to trigger workflow");
    } finally {
      setRunning(false);
    }
  }

  if (!workflow) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/workflows">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{workflow.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {workflow.triggerType.replace(/_/g, " ")}
            </Badge>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              workflow.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {workflow.status}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={toggleActive}>
          {workflow.status === "ACTIVE" ? "Pause" : "Activate"}
        </Button>
        <Button size="sm" onClick={() => setTriggerOpen(true)}>
          <Play className="mr-1 h-3 w-3" /> Test Run
        </Button>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {/* Trigger node */}
        <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 bg-primary/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/60 mb-1">Trigger</p>
          <p className="font-medium">{workflow.triggerType.replace(/_/g, " ")}</p>
        </div>

        {workflow.steps.length > 0 && (
          <div className="flex justify-center">
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        {workflow.steps.map((step, i) => (
          <div key={step.id}>
            <div className="border rounded-lg p-4 flex items-start gap-3 bg-card">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mb-1 ${ACTION_COLORS[step.actionType] ?? "bg-gray-100"}`}>
                  {ACTION_LABELS[step.actionType] ?? step.actionType}
                </span>
                {Object.keys(step.config).length > 0 && (
                  <pre className="text-xs text-muted-foreground mt-1 overflow-auto">
                    {JSON.stringify(step.config, null, 2)}
                  </pre>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => deleteStep(step.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {i < workflow.steps.length - 1 && (
              <div className="flex justify-center py-1">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Step
        </Button>
      </div>

      {/* Add Step Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Step</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label>Action</Label>
              <Select
                value={newAction.actionType}
                onValueChange={(v) => setNewAction({ ...newAction, actionType: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>{ACTION_LABELS[a] ?? a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(newAction.actionType === "SEND_EMAIL") && (
              <>
                <div className="grid gap-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject"
                    onChange={(e) => setNewAction({ ...newAction, config: { ...newAction.config, subject: e.target.value } })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Body</Label>
                  <Textarea
                    placeholder="Hi {{firstName}}, …"
                    rows={3}
                    onChange={(e) => setNewAction({ ...newAction, config: { ...newAction.config, body: e.target.value } })}
                  />
                </div>
              </>
            )}

            {(newAction.actionType === "SEND_SMS") && (
              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Hi {{firstName}}, …"
                  rows={3}
                  onChange={(e) => setNewAction({ ...newAction, config: { ...newAction.config, body: e.target.value } })}
                />
              </div>
            )}

            {(newAction.actionType === "ADD_TAG" || newAction.actionType === "REMOVE_TAG") && (
              <div className="grid gap-2">
                <Label>Tag</Label>
                <Input
                  placeholder="tag-name"
                  onChange={(e) => setNewAction({ ...newAction, config: { tag: e.target.value } })}
                />
              </div>
            )}

            {newAction.actionType === "WAIT" && (
              <div className="grid gap-2">
                <Label>Delay (seconds)</Label>
                <Input
                  type="number"
                  placeholder="60"
                  onChange={(e) => setNewAction({ ...newAction, config: { delaySeconds: Number(e.target.value) } })}
                />
              </div>
            )}

            {newAction.actionType === "WEBHOOK" && (
              <div className="grid gap-2">
                <Label>URL</Label>
                <Input
                  placeholder="https://example.com/webhook"
                  onChange={(e) => setNewAction({ ...newAction, config: { url: e.target.value } })}
                />
              </div>
            )}

            {newAction.actionType === "INTERNAL_NOTE" && (
              <div className="grid gap-2">
                <Label>Note</Label>
                <Textarea
                  placeholder="Automated note…"
                  rows={3}
                  onChange={(e) => setNewAction({ ...newAction, config: { body: e.target.value } })}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={addStep}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Run Dialog */}
      <Dialog open={triggerOpen} onOpenChange={setTriggerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Test Run</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label>Contact ID (optional)</Label>
              <Input
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                placeholder="UUID of contact to use"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTriggerOpen(false)}>Cancel</Button>
              <Button onClick={triggerManually} disabled={running}>
                {running ? "Running…" : "Run Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
