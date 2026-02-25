import { useState, useRef, useCallback } from "preact/hooks";
import { Plus, Search } from "lucide-preact";
import { useCrm } from "../context";

export function Toolbar({ onAdd }: { onAdd: (() => void) | null }) {
  const { view, stats, contactsPag, companiesPag, setContactsSearch, setCompaniesSearch } = useCrm();
  const [searchValue, setSearchValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const titles = { contacts: "Contacts", companies: "Companies", deals: "Deals" };
  const counts = { contacts: stats.contacts, companies: stats.companies, deals: stats.deals };

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (view === "contacts") setContactsSearch(value);
      else if (view === "companies") setCompaniesSearch(value);
    }, 300);
  }, [view, setContactsSearch, setCompaniesSearch]);

  // Reset search when view changes
  const prevView = useRef(view);
  if (prevView.current !== view) {
    prevView.current = view;
    if (searchValue) {
      setSearchValue("");
    }
  }

  return (
    <div class="toolbar">
      <div class="toolbar-left">
        <h1>{titles[view]}</h1>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {counts[view]} {counts[view] === 1 ? "record" : "records"}
        </span>
      </div>
      <div class="toolbar-actions">
        {onAdd && (
          <>
            <div class="search-box">
              <Search size={14} />
              <input
                class="search-input"
                type="text"
                placeholder={`Search ${titles[view].toLowerCase()}...`}
                value={searchValue}
                onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
                aria-label={`Search ${titles[view]}`}
              />
            </div>
            <button class="btn btn-primary" onClick={onAdd} aria-label={`Add ${view.slice(0, -1)}`}>
              <Plus size={14} /> Add
            </button>
          </>
        )}
      </div>
    </div>
  );
}
