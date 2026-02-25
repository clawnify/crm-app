import { useState } from "preact/hooks";
import { Pencil, Trash2 } from "lucide-preact";
import { useCrm } from "../context";
import { Avatar } from "./avatar";
import { EntityIcon } from "./entity-icon";
import { formatCurrency } from "../utils";
import type { Deal } from "../types";

const STAGES = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"];

export function DealCard({ deal }: { deal: Deal }) {
  const { isAgent, updateDeal, deleteDeal, contactLookup, setError } = useCrm();
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
      close_date: deal.close_date || "",
      notes: deal.notes || "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateDeal(deal.id, {
      ...editData,
      contact_id: editData.contact_id ? parseInt(editData.contact_id, 10) : null,
      value: parseFloat(editData.value) || 0,
    } as unknown as Partial<Deal>)
      .then(() => setEditing(false))
      .catch((err) => setError((err as Error).message));
  };

  const handleDelete = () => {
    deleteDeal(deal.id).catch((err) => {
      setError((err as Error).message);
      setConfirmDelete(false);
    });
  };

  const moveTo = (stage: string) => {
    updateDeal(deal.id, { stage } as Partial<Deal>)
      .catch((err) => setError((err as Error).message));
  };

  if (editing) {
    return (
      <div class="deal-card deal-card-editing">
        <div class="deal-card-edit-grid">
          <div>
            <label>Name</label>
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
        </div>
        <div class="deal-card-edit-actions">
          <button class="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
          <button class="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      class="deal-card"
      draggable={!isAgent}
      onDragStart={(e) => {
        e.dataTransfer!.setData("text/plain", String(deal.id));
        e.dataTransfer!.effectAllowed = "move";
        (e.target as HTMLElement).classList.add("dragging");
      }}
      onDragEnd={(e) => {
        (e.target as HTMLElement).classList.remove("dragging");
      }}
    >
      <div class="deal-card-name">{deal.name}</div>

      {deal.company_name && (
        <div class="deal-card-field">
          <EntityIcon name={deal.company_name} domain={deal.company_domain} />
          <span>{deal.company_name}</span>
        </div>
      )}

      {contactName && (
        <div class="deal-card-field">
          <Avatar firstName={deal.contact_first_name || ""} lastName={deal.contact_last_name || ""} />
          <span>{contactName}</span>
        </div>
      )}

      <div class="deal-card-value">{formatCurrency(deal.value)}</div>

      <div class="deal-card-actions">
        {confirmDelete ? (
          <span class="confirm-bar">
            Delete?
            <button class="btn btn-sm btn-danger" onClick={handleDelete}>Yes</button>
            <button class="btn btn-sm" onClick={() => setConfirmDelete(false)}>No</button>
          </span>
        ) : (
          <>
            {isAgent && (
              <select
                class="deal-card-move-select"
                value=""
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  if (val) moveTo(val);
                }}
                aria-label={`Move ${deal.name} to stage`}
              >
                <option value="">Move to...</option>
                {STAGES.filter((s) => s !== deal.stage).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            <button class="btn btn-sm" onClick={startEdit} aria-label={`Edit ${deal.name}`}>
              <Pencil size={12} />
            </button>
            <button class="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${deal.name}`}>
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
