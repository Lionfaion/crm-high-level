import type { Metadata } from "next";
import { ReputationClient } from "./reputation-client";

export const metadata: Metadata = { title: "Reputación" };

export default function ReputationPage() {
  return <ReputationClient />;
}
