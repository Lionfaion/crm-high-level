"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: string;
  appointmentType: { name: string; color: string; duration: number };
  contact: { firstName: string; lastName: string | null } | null;
}

interface AppointmentType {
  id: string;
  name: string;
  color: string;
  duration: number;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:  "bg-blue-100 text-blue-700",
  CONFIRMED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-700",
  COMPLETED:  "bg-gray-100 text-gray-700",
  NO_SHOW:    "bg-yellow-100 text-yellow-700",
};

export function CalendarClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected]         = useState<Date | null>(null);
  const [createOpen, setCreateOpen]     = useState(false);
  const [form, setForm]                 = useState({
    appointmentTypeId: "",
    title: "",
    startAt: "",
    endAt: "",
    contactId: "",
  });
  const [saving, setSaving] = useState(false);

  const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const to   = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const { data: apptData, mutate } = useSWR<{ appointments: Appointment[] }>(
    `/v1/calendar?from=${from}&to=${to}&pageSize=200`
  );

  const { data: typesData } = useSWR<{ types: AppointmentType[] }>(
    "/v1/calendar/types"
  );

  const appointments = apptData?.appointments ?? [];
  const types        = typesData?.types ?? [];
  const days         = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const dayAppts = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.startAt), day));

  const selectedAppts = selected ? dayAppts(selected) : [];

  async function createAppointment() {
    setSaving(true);
    try {
      await api.post("/v1/calendar", {
        ...form,
        contactId: form.contactId || undefined,
      });
      toast.success("Turno creado");
      setCreateOpen(false);
      setForm({ appointmentTypeId: "", title: "", startAt: "", endAt: "", contactId: "" });
      mutate();
    } catch {
      toast.error("Error al crear el turno");
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppt(id: string) {
    try {
      await api.post(`/v1/calendar/${id}/cancel`, {});
      toast.success("Turno cancelado");
      mutate();
    } catch {
      toast.error("Error al cancelar");
    }
  }

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();

  return (
    <div className="p-6 flex gap-6">
      {/* Calendar grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold w-40 text-center">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Turno
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
            <div key={d} className="bg-muted/50 text-center text-xs font-medium py-2 text-muted-foreground">
              {d}
            </div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-background min-h-[80px]" />
          ))}
          {days.map((day) => {
            const appts = dayAppts(day);
            const isSelected = selected && isSameDay(day, selected);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelected(isSameDay(day, selected ?? new Date(0)) ? null : day)}
                className={cn(
                  "bg-background min-h-[80px] p-1.5 text-left hover:bg-muted/30 transition-colors relative",
                  isSelected && "ring-2 ring-inset ring-primary",
                )}
              >
                <span className={cn(
                  "text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "d")}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {appts.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      className="text-xs truncate rounded px-1"
                      style={{ backgroundColor: a.appointmentType.color + "33", color: a.appointmentType.color }}
                    >
                      {format(new Date(a.startAt), "HH:mm")} {a.title}
                    </div>
                  ))}
                  {appts.length > 2 && (
                    <div className="text-xs text-muted-foreground">+{appts.length - 2} más</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail sidebar */}
      {selected && (
        <div className="w-72 flex-shrink-0">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">{format(selected, "EEEE, MMMM d")}</h3>
            {selectedAppts.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                <CalIcon className="mx-auto h-6 w-6 mb-2 opacity-30" />
                Sin turnos
              </div>
            ) : (
              <div className="space-y-2">
                {selectedAppts.map((a) => (
                  <div key={a.id} className="border rounded p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(a.startAt), "HH:mm")} – {format(new Date(a.endAt), "HH:mm")}
                        </p>
                        {a.contact && (
                          <p className="text-xs text-muted-foreground">
                            {a.contact.firstName} {a.contact.lastName ?? ""}
                          </p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] ?? ""}`}>
                        {a.status}
                      </span>
                    </div>
                    {a.status === "SCHEDULED" || a.status === "CONFIRMED" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-destructive hover:text-destructive text-xs h-6 px-2"
                        onClick={() => cancelAppt(a.id)}
                      >
                        Cancelar
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Turno</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={form.appointmentTypeId}
                onValueChange={(v) => setForm({ ...form, appointmentTypeId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo…" /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.duration} min)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título del turno"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>Inicio</Label>
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Fin</Label>
                <Input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>ID de contacto (opcional)</Label>
              <Input
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                placeholder="UUID"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button
                onClick={createAppointment}
                disabled={saving || !form.appointmentTypeId || !form.title || !form.startAt || !form.endAt}
              >
                {saving ? "Creando…" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
