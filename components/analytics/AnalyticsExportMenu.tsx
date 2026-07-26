"use client";

import { IconDownload } from "@/components/ui/icons";
import { useAnalyticsDashboard } from "@/contexts/analytics/AnalyticsDashboardContext";
import {
  buildDashboardCsv,
  buildDashboardExcelHtml,
  downloadFile,
} from "@/domain/analytics/export";

/** CSV e "Excel" (tabela HTML com o MIME do Excel — o Excel abre e
 * interpreta corretamente, sem precisar de nenhuma biblioteca nova) geram o
 * arquivo no cliente a partir dos dados já resolvidos. PDF usa
 * window.print() — o próprio navegador gera o PDF via "Salvar como PDF",
 * sem dependência nenhuma; @media print em styles/analytics.css esconde
 * menu/sidebar e mostra só a grade de widgets. */
export function AnalyticsExportMenu({ dashboardName }: { dashboardName: string }) {
  const { widgetsData } = useAnalyticsDashboard();

  function exportCsv() {
    downloadFile(
      buildDashboardCsv(dashboardName, widgetsData),
      `${dashboardName}.csv`,
      "text/csv;charset=utf-8",
    );
  }

  function exportExcel() {
    downloadFile(
      buildDashboardExcelHtml(dashboardName, widgetsData),
      `${dashboardName}.xls`,
      "application/vnd.ms-excel",
    );
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div className="crm-modal-actions crm-an-export-menu" style={{ justifyContent: "flex-start" }}>
      <button type="button" className="btn btn-outline" onClick={exportCsv}>
        <IconDownload size={13} /> CSV
      </button>
      <button type="button" className="btn btn-outline" onClick={exportExcel}>
        <IconDownload size={13} /> Excel
      </button>
      <button type="button" className="btn btn-outline" onClick={exportPdf}>
        <IconDownload size={13} /> PDF
      </button>
    </div>
  );
}
