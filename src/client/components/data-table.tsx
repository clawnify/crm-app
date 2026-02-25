import { useState } from "preact/hooks";
import { useCrm } from "../context";
import { Toolbar } from "./toolbar";
import { AddForm } from "./add-form";
import { ContactsTable } from "./contacts-table";
import { CompaniesTable } from "./companies-table";
import { DealsTable } from "./deals-table";
import { Pagination } from "./pagination";

export function DataTable() {
  const {
    view, loading,
    contactsPag, setContactsPage,
    companiesPag, setCompaniesPage,
    dealsPag, setDealsPage,
  } = useCrm();
  const [showAddForm, setShowAddForm] = useState(false);

  const pag = view === "contacts" ? contactsPag
    : view === "companies" ? companiesPag
    : dealsPag;

  const onPage = view === "contacts" ? setContactsPage
    : view === "companies" ? setCompaniesPage
    : setDealsPage;

  if (loading) {
    return <div class="loading-text">Loading...</div>;
  }

  return (
    <>
      <Toolbar onAdd={() => setShowAddForm(true)} />
      {showAddForm && <AddForm onClose={() => setShowAddForm(false)} />}
      <div class="card">
        <div class="table-wrap">
          {view === "contacts" && <ContactsTable />}
          {view === "companies" && <CompaniesTable />}
          {view === "deals" && <DealsTable />}
        </div>
        <Pagination pag={pag} onPage={onPage} />
      </div>
    </>
  );
}
