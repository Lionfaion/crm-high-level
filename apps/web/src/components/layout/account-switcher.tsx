"use client";

import { ChevronsUpDown, Check, Building2 } from "lucide-react";
import { useAccount } from "@/lib/account-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AccountSwitcher() {
  const { accounts, activeAccount, setActiveAccount } = useAccount();
  const [open, setOpen] = useState(false);

  if (!activeAccount || accounts.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Building2 className="h-4 w-4 text-sidebar-foreground/50 shrink-0" />
        <span className="text-sm font-medium truncate">{activeAccount?.name ?? "—"}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="w-full justify-start gap-2 px-3 h-9 text-sidebar-foreground hover:bg-white/5"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left text-sm truncate">{activeAccount.name}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/40 shrink-0" />
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-lg py-1">
          {accounts.map((account) => (
            <button
              key={account.id}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => { setActiveAccount(account); setOpen(false); }}
            >
              <Check className={cn("h-3.5 w-3.5", account.id === activeAccount.id ? "opacity-100" : "opacity-0")} />
              <span className="truncate">{account.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
