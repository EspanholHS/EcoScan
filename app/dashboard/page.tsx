import type { Metadata } from "next";
import { Header, Footer } from "@/components/brand";
import { Dashboard } from "@/components/dashboard";
import "./dashboard.css";
import { HistoryAtmosphere } from "@/components/history-atmosphere";
export const metadata: Metadata = { title: "Meu histórico | EcoScan" };
export default function DashboardPage() {
  return (
    <div className="history-shell">
      <HistoryAtmosphere />
      <Header active="dashboard" />
      <main id="conteudo">
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}
