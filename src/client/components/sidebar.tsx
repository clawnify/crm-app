import { Users, Building2, DollarSign } from "lucide-preact";
import { useCrm } from "../context";
import type { View } from "../types";

const NAV_ITEMS: { view: View; label: string; icon: typeof Users }[] = [
  { view: "contacts", label: "Contacts", icon: Users },
  { view: "companies", label: "Companies", icon: Building2 },
  { view: "deals", label: "Deals", icon: DollarSign },
];

export function Sidebar() {
  const { view, setView, stats } = useCrm();

  const counts: Record<View, number> = {
    contacts: stats.contacts,
    companies: stats.companies,
    deals: stats.deals,
  };

  return (
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          <Users size={16} />
        </div>
        CRM
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-title">Records</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            class={`sidebar-item ${view === item.view ? "active" : ""}`}
            data-entity={item.view}
            onClick={() => setView(item.view)}
            aria-label={`View ${item.label}`}
          >
            <item.icon size={16} />
            {item.label}
            <span class="sidebar-badge">{counts[item.view]}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
