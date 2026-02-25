import { useState } from "preact/hooks";
import { Pencil, Trash2, Mail, Phone } from "lucide-preact";
import { useCrm } from "../context";
import { Avatar } from "./avatar";
import { EntityIcon } from "./entity-icon";
import { Pill } from "./pill";
import type { Contact } from "../types";

const STATUSES = ["lead", "active", "inactive", "churned"];

export function ContactsTable() {
  const { contacts, contactsPag, setContactsSort, isAgent, updateContact, deleteContact, companyLookup, setError } = useCrm();

  const sortHeader = (col: string, label: string, align?: string) => (
    <th
      class={`sortable ${align === "right" ? "align-right" : ""}`}
      onClick={() => setContactsSort(col)}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {contactsPag.sort === col && (
        <span class="sort-icon">{contactsPag.order === "asc" ? "\u25B3" : "\u25BC"}</span>
      )}
    </th>
  );

  return (
    <table>
      <thead>
        <tr>
          {sortHeader("first_name", "Name")}
          {sortHeader("email", "Email")}
          <th>Phone</th>
          <th>Company</th>
          <th>Title</th>
          {sortHeader("status", "Status")}
          <th style={{ width: "100px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {contacts.length === 0 && (
          <tr><td colSpan={7} class="empty-text">No contacts found</td></tr>
        )}
        {contacts.map((contact) => (
          <ContactRow key={contact.id} contact={contact} isAgent={isAgent}
            companyLookup={companyLookup} onUpdate={updateContact}
            onDelete={deleteContact} onError={setError} />
        ))}
      </tbody>
    </table>
  );
}

function ContactRow({ contact, isAgent, companyLookup, onUpdate, onDelete, onError }: {
  contact: Contact;
  isAgent: boolean;
  companyLookup: { id: number; name: string; domain: string }[];
  onUpdate: (id: number, data: Partial<Contact>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const fullName = `${contact.first_name} ${contact.last_name}`.trim();

  const startEdit = () => {
    setEditData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      company_id: String(contact.company_id || ""),
      title: contact.title,
      status: contact.status,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(contact.id, {
      ...editData,
      company_id: editData.company_id ? parseInt(editData.company_id, 10) : null,
    } as Partial<Contact>)
      .then(() => setEditing(false))
      .catch((err) => onError((err as Error).message));
  };

  const handleDelete = () => {
    onDelete(contact.id).catch((err) => {
      onError((err as Error).message);
      setConfirmDelete(false);
    });
  };

  return (
    <>
      <tr>
        <td>
          <span class="avatar-name">
            <Avatar firstName={contact.first_name} lastName={contact.last_name} />
            {fullName}
          </span>
        </td>
        <td>
          {contact.email ? (
            <a class="cell-link" href={`mailto:${contact.email}`}>{contact.email}</a>
          ) : <span class="muted">—</span>}
        </td>
        <td>
          {contact.phone ? (
            <a class="cell-link" href={`tel:${contact.phone}`}>{contact.phone}</a>
          ) : <span class="muted">—</span>}
        </td>
        <td>
          {contact.company_name ? (
            <span class="entity-name">
              <EntityIcon name={contact.company_name} domain={contact.company_domain} />
              {contact.company_name}
            </span>
          ) : <span class="muted">—</span>}
        </td>
        <td>{contact.title || <span class="muted">—</span>}</td>
        <td><Pill value={contact.status} /></td>
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
                  <button class="btn btn-sm agent-only" onClick={startEdit} aria-label={`Edit ${fullName}`}>
                    <Pencil size={12} /> Edit
                  </button>
                )}
                <button class="btn btn-sm btn-danger" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${fullName}`}>
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
                <label>First Name</label>
                <input value={editData.first_name} onInput={(e) => setEditData({ ...editData, first_name: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Last Name</label>
                <input value={editData.last_name} onInput={(e) => setEditData({ ...editData, last_name: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={editData.email} onInput={(e) => setEditData({ ...editData, email: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Phone</label>
                <input type="tel" value={editData.phone} onInput={(e) => setEditData({ ...editData, phone: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Company</label>
                <select value={editData.company_id} onChange={(e) => setEditData({ ...editData, company_id: (e.target as HTMLSelectElement).value })}>
                  <option value="">None</option>
                  {companyLookup.map((co) => (
                    <option key={co.id} value={co.id}>{co.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Title</label>
                <input value={editData.title} onInput={(e) => setEditData({ ...editData, title: (e.target as HTMLInputElement).value })} />
              </div>
              <div>
                <label>Status</label>
                <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: (e.target as HTMLSelectElement).value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
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
