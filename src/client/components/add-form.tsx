import { useState } from "preact/hooks";
import { useCrm } from "../context";

const STATUSES = ["lead", "active", "inactive", "churned"];
const STAGES = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"];
const INDUSTRIES = ["Technology", "Software", "Manufacturing", "Healthcare", "Finance", "Retail", "Education", "Consulting"];

export function AddForm({ onClose }: { onClose: () => void }) {
  const { view, addContact, addCompany, addDeal, companyLookup, contactLookup, setError } = useCrm();

  if (view === "contacts") return <AddContactForm onClose={onClose} addContact={addContact} companyLookup={companyLookup} onError={setError} />;
  if (view === "companies") return <AddCompanyForm onClose={onClose} addCompany={addCompany} onError={setError} />;
  return <AddDealForm onClose={onClose} addDeal={addDeal} contactLookup={contactLookup} onError={setError} />;
}

function AddContactForm({ onClose, addContact, companyLookup, onError }: {
  onClose: () => void;
  addContact: (data: Record<string, unknown>) => Promise<void>;
  companyLookup: { id: number; name: string }[];
  onError: (msg: string | null) => void;
}) {
  const [data, setData] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    company_id: "", title: "", status: "lead",
  });

  const handleSubmit = () => {
    if (!data.first_name.trim()) { onError("First name is required"); return; }
    addContact({ ...data, company_id: data.company_id ? parseInt(data.company_id, 10) : null })
      .then(onClose)
      .catch((err) => onError((err as Error).message));
  };

  return (
    <div class="add-form-bar">
      <div class="add-form-grid">
        <div>
          <label>First Name *</label>
          <input value={data.first_name} onInput={(e) => setData({ ...data, first_name: (e.target as HTMLInputElement).value })} aria-label="First name" />
        </div>
        <div>
          <label>Last Name</label>
          <input value={data.last_name} onInput={(e) => setData({ ...data, last_name: (e.target as HTMLInputElement).value })} aria-label="Last name" />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={data.email} onInput={(e) => setData({ ...data, email: (e.target as HTMLInputElement).value })} aria-label="Email" />
        </div>
        <div>
          <label>Phone</label>
          <input type="tel" value={data.phone} onInput={(e) => setData({ ...data, phone: (e.target as HTMLInputElement).value })} aria-label="Phone" />
        </div>
        <div>
          <label>Company</label>
          <select value={data.company_id} onChange={(e) => setData({ ...data, company_id: (e.target as HTMLSelectElement).value })} aria-label="Company">
            <option value="">None</option>
            {companyLookup.map((co) => <option key={co.id} value={co.id}>{co.name}</option>)}
          </select>
        </div>
        <div>
          <label>Title</label>
          <input value={data.title} onInput={(e) => setData({ ...data, title: (e.target as HTMLInputElement).value })} aria-label="Title" />
        </div>
        <div>
          <label>Status</label>
          <select value={data.status} onChange={(e) => setData({ ...data, status: (e.target as HTMLSelectElement).value })} aria-label="Status">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div class="add-form-actions">
          <button class="btn btn-primary btn-sm" onClick={handleSubmit} aria-label="Save contact">Save</button>
          <button class="btn btn-sm" onClick={onClose} aria-label="Cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AddCompanyForm({ onClose, addCompany, onError }: {
  onClose: () => void;
  addCompany: (data: Record<string, unknown>) => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [data, setData] = useState({
    name: "", domain: "", industry: "", phone: "", email: "", notes: "",
  });

  const handleSubmit = () => {
    if (!data.name.trim()) { onError("Name is required"); return; }
    addCompany(data)
      .then(onClose)
      .catch((err) => onError((err as Error).message));
  };

  return (
    <div class="add-form-bar">
      <div class="add-form-grid">
        <div>
          <label>Name *</label>
          <input value={data.name} onInput={(e) => setData({ ...data, name: (e.target as HTMLInputElement).value })} aria-label="Company name" />
        </div>
        <div>
          <label>Domain</label>
          <input value={data.domain} onInput={(e) => setData({ ...data, domain: (e.target as HTMLInputElement).value })} placeholder="example.com" aria-label="Domain" />
        </div>
        <div>
          <label>Industry</label>
          <select value={data.industry} onChange={(e) => setData({ ...data, industry: (e.target as HTMLSelectElement).value })} aria-label="Industry">
            <option value="">None</option>
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        <div>
          <label>Phone</label>
          <input type="tel" value={data.phone} onInput={(e) => setData({ ...data, phone: (e.target as HTMLInputElement).value })} aria-label="Phone" />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={data.email} onInput={(e) => setData({ ...data, email: (e.target as HTMLInputElement).value })} aria-label="Email" />
        </div>
        <div class="add-form-actions">
          <button class="btn btn-primary btn-sm" onClick={handleSubmit} aria-label="Save company">Save</button>
          <button class="btn btn-sm" onClick={onClose} aria-label="Cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AddDealForm({ onClose, addDeal, contactLookup, onError }: {
  onClose: () => void;
  addDeal: (data: Record<string, unknown>) => Promise<void>;
  contactLookup: { id: number; first_name: string; last_name: string }[];
  onError: (msg: string | null) => void;
}) {
  const [data, setData] = useState({
    name: "", contact_id: "", value: "", stage: "prospect", close_date: "", notes: "",
  });

  const handleSubmit = () => {
    if (!data.name.trim()) { onError("Deal name is required"); return; }
    addDeal({
      ...data,
      contact_id: data.contact_id ? parseInt(data.contact_id, 10) : null,
      value: parseFloat(data.value) || 0,
    })
      .then(onClose)
      .catch((err) => onError((err as Error).message));
  };

  return (
    <div class="add-form-bar">
      <div class="add-form-grid">
        <div>
          <label>Deal Name *</label>
          <input value={data.name} onInput={(e) => setData({ ...data, name: (e.target as HTMLInputElement).value })} aria-label="Deal name" />
        </div>
        <div>
          <label>Contact</label>
          <select value={data.contact_id} onChange={(e) => setData({ ...data, contact_id: (e.target as HTMLSelectElement).value })} aria-label="Contact">
            <option value="">None</option>
            {contactLookup.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.first_name} {ct.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Value ($)</label>
          <input type="number" value={data.value} onInput={(e) => setData({ ...data, value: (e.target as HTMLInputElement).value })} aria-label="Deal value" />
        </div>
        <div>
          <label>Stage</label>
          <select value={data.stage} onChange={(e) => setData({ ...data, stage: (e.target as HTMLSelectElement).value })} aria-label="Stage">
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Close Date</label>
          <input type="date" value={data.close_date} onInput={(e) => setData({ ...data, close_date: (e.target as HTMLInputElement).value })} aria-label="Close date" />
        </div>
        <div class="add-form-actions">
          <button class="btn btn-primary btn-sm" onClick={handleSubmit} aria-label="Save deal">Save</button>
          <button class="btn btn-sm" onClick={onClose} aria-label="Cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}
