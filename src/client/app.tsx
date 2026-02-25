import { useEffect, useMemo } from "preact/hooks";
import { CrmContext } from "./context";
import { useCrmState } from "./hooks/use-crm";
import { Sidebar } from "./components/sidebar";
import { DataTable } from "./components/data-table";
import { ErrorBanner } from "./components/error-banner";

export function App() {
  const isAgent = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("agent") || params.get("mode") === "agent";
  }, []);

  useEffect(() => {
    if (isAgent) {
      document.documentElement.setAttribute("data-agent", "");
    }
  }, [isAgent]);

  const crmState = useCrmState(isAgent);

  return (
    <CrmContext.Provider value={crmState}>
      <div class="layout">
        <Sidebar />
        <main class="main-content">
          <DataTable />
        </main>
      </div>
      <ErrorBanner />
    </CrmContext.Provider>
  );
}
