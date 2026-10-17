import type { Metadata } from "next";
import NotificationHistoryExperience from "@/components/NotificationHistoryExperience";

export const metadata: Metadata = {
  title: "Notifications — CabBook",
  description: "Browse your CabBook ride updates and notification history.",
};

export default function NotificationsPage() {
  return <NotificationHistoryExperience />;
}
