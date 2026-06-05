"use client";

import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr";
import { AccountProvider } from "@/lib/account-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <AccountProvider>{children}</AccountProvider>
    </SWRConfig>
  );
}
