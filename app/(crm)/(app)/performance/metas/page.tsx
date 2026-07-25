import type { Metadata } from "next";
import { fetchPerformanceGoalsPageData } from "@/application/performance/performanceQueries";
import { GoalsPageClient } from "@/components/performance/GoalsPageClient";

export const metadata: Metadata = {
  title: "Metas — Performance — Brusync OS",
};

export default async function PerformanceMetasPage() {
  const data = await fetchPerformanceGoalsPageData();
  return <GoalsPageClient goals={data.goals} />;
}
