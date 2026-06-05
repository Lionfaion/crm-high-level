"use client";

import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  channel: string;
  status: string;
  createdAt: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  messages: Message[];
}

export function InboxClient() {
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply]       = useState("");
  const [sending, setSending]   = useState(false);

  const { data, mutate } = useSWR<{ conversations: Conversation[]; total: number }>(
    "/v1/messaging/conversations",
    () => api.get("/v1/messaging/conversations"),
    { refreshInterval: 10000 }
  );

  const { data: convData, mutate: mutateConv } = useSWR<{ conversation: Conversation }>(
    selected ? `/v1/messaging/conversations/${selected}` : null,
    () => api.get(`/v1/messaging/conversations/${selected}`),
    { refreshInterval: 5000 }
  );

  const conversations = data?.conversations ?? [];
  const conv = convData?.conversation;

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await api.post(`/v1/messaging/conversations/${selected}/reply`, { body: reply });
      setReply("");
      mutateConv();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function closeConversation() {
    if (!selected) return;
    await api.post(`/v1/messaging/conversations/${selected}/close`, {});
    mutate();
    mutateConv();
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold">Inbox</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} conversations</p>
        </div>
        <ScrollArea className="flex-1">
          {conversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={cn(
                "w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors",
                selected === c.id && "bg-muted"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {c.contact.firstName} {c.contact.lastName ?? ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{c.channel}</Badge>
                <Badge
                  variant={c.status === "OPEN" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {c.status}
                </Badge>
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Conversation view */}
      <div className="flex-1 flex flex-col">
        {!conv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p>Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {conv.contact.firstName} {conv.contact.lastName ?? ""}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {conv.contact.email ?? conv.contact.phone ?? "No contact info"}
                </p>
              </div>
              {conv.status === "OPEN" && (
                <Button variant="outline" size="sm" onClick={closeConversation}>
                  Close
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-3">
                {conv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                      msg.direction === "INBOUND"
                        ? "bg-muted mr-auto"
                        : "bg-primary text-primary-foreground ml-auto"
                    )}
                  >
                    <p>{msg.body}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      msg.direction === "INBOUND" ? "text-muted-foreground" : "text-primary-foreground/70"
                    )}>
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {conv.status === "OPEN" && (
              <div className="p-4 border-t flex gap-2">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
                  }}
                />
                <Button onClick={sendReply} disabled={sending || !reply.trim()} size="icon" className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
