import { useState } from "preact/hooks";
import { Pencil, Trash2 } from "lucide-preact";
import { useCrm } from "../context";
import { Avatar } from "./avatar";
import { EntityIcon } from "./entity-icon";
import { Pill } from "./pill";
import { formatCurrency, formatDate } from "../utils";
import type { Deal } from "../types";

const STAGES = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"];

export function DealsTable() {
  const { deals, dealsPag, dealsTotalValue, setDealsSort, isAgent, updateDeal, deleteDeal, contactLookup, setError } = useCrm();

  const sortHeader = (col: string, label: string, align?: string) => (
    <th
      class={`sortable ${align === "right" ? "align-right" : ""}`}
      onClick={() => setDealsSort(col)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {dealsPag.sort === col && (
        <span class="sort-icon">{dealsPag.order === "asc" ? "\u25B3" : "\u25BC"}</span>
      )}
    </th>
  );

  return (
    <table>
      <thead>
        <tr>
          {sortHeader("name", "Deal")}
          <th>Contact</th>
          <th>Company</th>
          {sortHeader("value", "Value", "right")}
          {sortHeader("stage", "Stage")}
          {sortHeader("close_date", "Close Date")}
          <th style={{ width: "100px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {deals.length === 0 && (
          <tr><td colSpan={7} class="empty-text">No deals found</td></tr>
        )}
        {deals.map((deal) => (
          <DealRow key={deal.id} deal={deal} isAgent={isAgent}
            contactLookup={contactLookup} onUpdate={updateDeal}
            onDelete={deleteDeal} onError={setError} />
        ))}
      </tbody>
      {deals.length > 0 && (
        <tfoot>
          <tr class="footer-calc">
            <td>{deals.length} deals</td>
            <td />
            <td />
            <td class="align-right currency">{formatCurrency(dealsTotalValue)}</td>
            <td />
            <td />
            <td />
          </tr>
        </tfoot>
      )}
    </table>
  );
}

function DealRow({ deal, isAgent, contactLookup, onUpdate, onDelete, onError }: {
  deal: Deal;
  isAgent: boolean;
  contactLookup: { id: number; first_name: string; last_name: string; company_name?: string; company_domain?: string }[];
  onUpdate: (id: number, data: Partial<Deal>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});

  const contactName = deal.contact_first_name
    ? `${deal.contact_first_name} ${deal.contact_last_name || ""}`.trim()
    : "";

  const startEdit = () => {
    setEditData({
      name: deal.name,
      contact_id: String(deal.contact_id || ""),
      value: String(deal.value || 0),
      stage: deal.stage,
      close_date: deal.close_date,
      notes: deal.notes,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(deal.id, {
      ...editData,
      contact_id: editData.contact_id ? parseInt(editData.contact_id, 10) : null,
      value: parseFloat(editData.value) || 0,
    } as unknown as Partial<Deal>)
      .then(() => setEditing(false))
      .catch((err) => onError((err as Error).message));
  };

  const handleDelete = () => {
    onDelete(deal.id).catch((err) => {
      onError((err as Error).message);
      setConfirmDelete(false);
    });
  };

  return (
    <>
      <tr>
        <td>{deal.name}</td>
        <td>
          {contactName ? (
            <span class="avatar-name">
              <Avatar firstName={deal.contact_first_name || ""} lastName={deal.contact_last_name || ""} />
              {contactName}
            </span>
          ) : <span class="muted">—</span>}
        </td>
        <td>
          {deal.company_name ? (
            <span class="entity-name">
              <EntityIcon name={deal.company_name} domain={deal.company_domain} />
              {deal.company_name}
            </span>
          ) : <span class="muted">—</span>}
        </td>
        <td class="align-right currency">{formatCurrency(deal.value)}</td>
        <td><Pill value={deal.stage} /></td>
        <td>{formatDate(deal.close_date) || <span class="muted">—</span>}</td>
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
                  <button class="btn btn-sm agent-only" onClick={startEdit} aria-label={`Edit ${deal.name}`}>
                    <Pencil size={12} /> Edit
                  </button>
                )}
                <button class="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${deal.name}`}>
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
                <label>Deal Name</label>
                <input value={editData.name} onInput={(e) => setEditData({ ...editData, name: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Contact</label>
                <select value={editData.contact_id} onChange={(e) => setEditData({ ...editData, contact_id: (e.target as HTMLSelectElement).value })}>
                  <option value="">None</option>
                  {contactLookup.map((ct) => (
                    <option key={ct.id} value={ct.id}>{ct.first_name} {ct.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Value ($)</label>
                <input type="number" value={editData.value} onInput={(e) => setEditData({ ...editData, value: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Stage</label>
                <select value={editData.stage} onChange={(e) => setEditData({ ...editData, stage: (e.target as HTMLSelectElement).value })}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label>Close Date</label>
                <input type="date" value={editData.close_date} onInput={(e) => setEditData({ ...editData, close_date: (e.target as HTMLInputElement).value })} />
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
