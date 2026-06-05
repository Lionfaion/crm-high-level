import type { Metadata } from "next";
import AuthSessionProvider from "@/components/auth/session-provider";

export const metadata: Metadata = {
  title: "CRM High Level",
  description: "GoHighLevel CRM Clone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
