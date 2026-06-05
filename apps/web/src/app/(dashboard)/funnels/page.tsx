import type { Metadata } from "next";
import { FunnelsClient } from "./funnels-client";

export const metadata: Metadata = { title: "Funnels & Websites" };

export default function FunnelsPage() {
  return <FunnelsClient />;
}
