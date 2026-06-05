"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

type Account = { id: string; name: string; email: string; timezone: string };

type AccountContextValue = {
  accounts: Account[];
  activeAccount: Account | null;
  setActiveAccount: (a: Account) => void;
  isLoading: boolean;
};

const AccountContext = createContext<AccountContextValue>({
  accounts: [], activeAccount: null, setActiveAccount: () => {}, isLoading: true,
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken as string | undefined;

  const { data, isLoading } = useSWR<{ accounts: Account[] }>(
    token ? "/v1/accounts" : null,
  );

  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);

  useEffect(() => {
    if (!activeAccount && data?.accounts.length) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("activeAccountId") : null;
      const found = stored ? data.accounts.find((a) => a.id === stored) : null;
      setActiveAccountState(found ?? data.accounts[0]);
    }
  }, [data, activeAccount]);

  function setActiveAccount(a: Account) {
    setActiveAccountState(a);
    if (typeof window !== "undefined") localStorage.setItem("activeAccountId", a.id);
  }

  return (
    <AccountContext.Provider value={{ accounts: data?.accounts ?? [], activeAccount, setActiveAccount, isLoading }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => useContext(AccountContext);
