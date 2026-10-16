import type { Metadata } from "next";
import RideHistoryExperience from "@/components/RideHistoryExperience";

export const metadata: Metadata = {
  title: "Ride history — CabBook",
  description: "Review your CabBook demo ride requests, statuses, and estimated fares.",
};

export default function RideHistoryPage() {
  return <RideHistoryExperience />;
}
