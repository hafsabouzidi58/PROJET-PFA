"use client";
import Sidebar from "./Sidebar"; // Celui qu'on a créé avant
import Header from "./Header";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}