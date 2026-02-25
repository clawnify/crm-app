import { useState } from "preact/hooks";
import { useCrm } from "../context";
import { Toolbar } from "./toolbar";
import { AddForm } from "./add-form";
import { ContactsTable } from "./contacts-table";
import { CompaniesTable } from "./companies-table";
import { DealsBoard } from "./deals-board";
import { Pagination } from "./pagination";

export function DataTable() {
  const {
    view, loading,
    contactsPag, setContactsPage,
    companiesPag, setCompaniesPage,
  } = useCrm();
  const [showAddForm, setShowAddForm] = useState(false);

  const isTable = view === "contacts" || view === "companies";
  const pag = view === "contacts" ? contactsPag : companiesPag;
  const onPage = view === "contacts" ? setContactsPage : setCompaniesPage;

  if (loading) {
    return <div class="loading-text">Loading...</div>;
  }

  if (view === "deals") {
    return (
      <>
        <Toolbar onAdd={null} />
        <DealsBoard />
      </>
    );
  }

  return (
    <>
      <Toolbar onAdd={() => setShowAddForm(true)} />
      {showAddForm && <AddForm onClose={() => setShowAddForm(false)} />}
      <div class="card">
        <div class="table-wrap">
          {view === "contacts" && <ContactsTable />}
          {view === "companies" && <CompaniesTable />}
        </div>
        <Pagination pag={pag} onPage={onPage} />
      </div>
    </>
  );
}
