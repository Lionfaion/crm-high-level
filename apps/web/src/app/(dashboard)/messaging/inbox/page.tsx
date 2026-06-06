import type { Metadata } from "next";
import { InboxClient } from "./inbox-client";

export const metadata: Metadata = { title: "Bandeja de entrada" };

export default function InboxPage() {
  return <InboxClient />;
}
