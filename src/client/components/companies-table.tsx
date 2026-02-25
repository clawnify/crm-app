import { useState } from "preact/hooks";
import { Pencil, Trash2 } from "lucide-preact";
import { useCrm } from "../context";
import { EntityIcon } from "./entity-icon";
import { Pill } from "./pill";
import type { Company } from "../types";

const INDUSTRIES = ["Technology", "Software", "Manufacturing", "Healthcare", "Finance", "Retail", "Education", "Consulting"];

export function CompaniesTable() {
  const { companies, companiesPag, setCompaniesSort, isAgent, updateCompany, deleteCompany, setError } = useCrm();

  const sortHeader = (col: string, label: string) => (
    <th class="sortable" onClick={() => setCompaniesSort(col)} aria-label={`Sort by ${label}`}>
      {label}
      {companiesPag.sort === col && (
        <span class="sort-icon">{companiesPag.order === "asc" ? "\u25B3" : "\u25BC"}</span>
      )}
    </th>
  );

  return (
    <table>
      <thead>
        <tr>
          {sortHeader("name", "Name")}
          {sortHeader("domain", "Domain")}
          {sortHeader("industry", "Industry")}
          <th>Phone</th>
          <th>Email</th>
          <th style={{ textAlign: "right" }}>Contacts</th>
          <th style={{ width: "100px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {companies.length === 0 && (
          <tr><td colSpan={7} class="empty-text">No companies found</td></tr>
        )}
        {companies.map((company) => (
          <CompanyRow key={company.id} company={company} isAgent={isAgent}
            onUpdate={updateCompany} onDelete={deleteCompany} onError={setError} />
        ))}
      </tbody>
    </table>
  );
}

function CompanyRow({ company, isAgent, onUpdate, onDelete, onError }: {
  company: Company;
  isAgent: boolean;
  onUpdate: (id: number, data: Partial<Company>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});

  const startEdit = () => {
    setEditData({
      name: company.name,
      domain: company.domain,
      industry: company.industry,
      phone: company.phone,
      email: company.email,
      notes: company.notes,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(company.id, editData as Partial<Company>)
      .then(() => setEditing(false))
      .catch((err) => onError((err as Error).message));
  };

  const handleDelete = () => {
    onDelete(company.id).catch((err) => {
      onError((err as Error).message);
      setConfirmDelete(false);
    });
  };

  return (
    <>
      <tr>
        <td>
          <span class="entity-name">
            <EntityIcon name={company.name} domain={company.domain} />
            {company.name}
          </span>
        </td>
        <td>
          {company.domain ? (
            <a class="cell-link" href={`https://${company.domain}`} target="_blank" rel="noopener">
              {company.domain}
            </a>
          ) : <span class="muted">—</span>}
        </td>
        <td>{company.industry ? <Pill value={company.industry} /> : <span class="muted">—</span>}</td>
        <td>
          {company.phone ? (
            <a class="cell-link" href={`tel:${company.phone}`}>{company.phone}</a>
          ) : <span class="muted">—</span>}
        </td>
        <td>
          {company.email ? (
            <a class="cell-link" href={`mailto:${company.email}`}>{company.email}</a>
          ) : <span class="muted">—</span>}
        </td>
        <td class="align-right">{company.contact_count || 0}</td>
        <td>
          <div class="actions-cell">
            {confirmDelete ? (
              <span class="confirm-bar">
                Delete?
                <button class="btn btn-sm btn-danger" onClick={handleDelete} aria-label="Confirm delete">Yes</button>
                <button class="btn btn-sm" onClick={() => setConfirmDelete(false)} aria-label="Cancel delete">No</button>
              </span>
            ) : (
              <>
                {isAgent && !editing && (
                  <button class="btn btn-sm agent-only" onClick={startEdit} aria-label={`Edit ${company.name}`}>
                    <Pencil size={12} /> Edit
                  </button>
                )}
                <button class="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${company.name}`}>
                  <Trash2 size={12} />
                  {isAgent && " Delete"}
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {isAgent && editing && (
        <tr class="edit-form-row">
          <td colSpan={7}>
            <div class="edit-form-grid">
              <div>
                <label>Name</label>
                <input value={editData.name} onInput={(e) => setEditData({ ...editData, name: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Domain</label>
                <input value={editData.domain} onInput={(e) => setEditData({ ...editData, domain: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Industry</label>
                <select value={editData.industry} onChange={(e) => setEditData({ ...editData, industry: (e.target as HTMLSelectElement).value })}>
                  <option value="">None</option>
                  {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label>Phone</label>
                <input type="tel" value={editData.phone} onInput={(e) => setEditData({ ...editData, phone: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={editData.email} onInput={(e) => setEditData({ ...editData, email: (e.target as HTMLInputElement).value })} />
              </div>
              <div class="edit-form-actions">
                <button class="btn btn-primary btn-sm" onClick={saveEdit} aria-label="Save">Save</button>
                <button class="btn btn-sm" onClick={() => setEditing(false)} aria-label="Cancel">Cancel</button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
