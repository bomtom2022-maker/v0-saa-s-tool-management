import React from "react"
import { Sidebar } from "@/components/dashboard/sidebar";
import { NotificationProvider } from "@/lib/notifications";
import { DataStoreProvider } from "@/lib/data-store";
import { PageWrapper } from "@/components/dashboard/page-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataStoreProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <main className="pt-14 md:pt-0 md:ml-72">
            <PageWrapper>{children}</PageWrapper>
          </main>
        </div>
      </NotificationProvider>
    </DataStoreProvider>
  );
}
