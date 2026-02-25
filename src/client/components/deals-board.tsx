import { useState, useMemo, useCallback } from "preact/hooks";
import { Plus } from "lucide-preact";
import { useCrm } from "../context";
import { DealCard } from "./deal-card";
import { formatCurrency } from "../utils";
import type { Deal } from "../types";

const STAGES = [
  { key: "prospect", label: "Prospect", color: "#2563eb" },
  { key: "qualified", label: "Qualified", color: "#7c3aed" },
  { key: "proposal", label: "Proposal", color: "#d97706" },
  { key: "negotiation", label: "Negotiation", color: "#0891b2" },
  { key: "won", label: "Won", color: "#16a34a" },
  { key: "lost", label: "Lost", color: "#9ca3af" },
];

export function DealsBoard() {
  const { boardDeals, addDeal, updateDeal, contactLookup, setError, isAgent } = useCrm();

  const grouped = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    for (const s of STAGES) map[s.key] = [];
    for (const deal of boardDeals) {
      if (map[deal.stage]) map[deal.stage].push(deal);
    }
    return map;
  }, [boardDeals]);

  const onDrop = useCallback((dealId: number, newStage: string) => {
    updateDeal(dealId, { stage: newStage } as Partial<Deal>)
      .catch((err) => setError((err as Error).message));
  }, [updateDeal, setError]);

  return (
    <div class="deals-board">
      {STAGES.map((stage) => (
        <StageColumn
          key={stage.key}
          stage={stage}
          deals={grouped[stage.key]}
          isAgent={isAgent}
          addDeal={addDeal}
          contactLookup={contactLookup}
          onError={setError}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
}

function StageColumn({ stage, deals, isAgent, addDeal, contactLookup, onError, onDrop }: {
  stage: { key: string; label: string; color: string };
  deals: Deal[];
  isAgent: boolean;
  addDeal: (data: Partial<Deal>) => Promise<void>;
  contactLookup: { id: number; first_name: string; last_name: string }[];
  onError: (msg: string | null) => void;
  onDrop: (dealId: number, newStage: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", contact_id: "", value: "" });

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  const submitAdd = () => {
    if (!form.name.trim()) return;
    addDeal({
      name: form.name,
      stage: stage.key,
      contact_id: form.contact_id ? parseInt(form.contact_id, 10) : null,
      value: parseFloat(form.value) || 0,
    } as unknown as Partial<Deal>)
      .then(() => {
        setForm({ name: "", contact_id: "", value: "" });
        setAdding(false);
      })
      .catch((err) => onError((err as Error).message));
  };

  return (
    <div
      class="deals-column"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
        (e.currentTarget as HTMLElement).classList.add("drag-over");
      }}
      onDragLeave={(e) => {
        (e.currentTarget as HTMLElement).classList.remove("drag-over");
      }}
      onDrop={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).classList.remove("drag-over");
        const dealId = e.dataTransfer?.getData("text/plain");
        if (dealId) onDrop(parseInt(dealId, 10), stage.key);
      }}
    >
      <div class="deals-column-header">
        <span class="deals-stage-dot" style={{ background: stage.color }} />
        <span class="deals-stage-label">{stage.label}</span>
        <span class="deals-stage-count">{deals.length}</span>
        <button
          class="deals-add-btn"
          onClick={() => setAdding(true)}
          aria-label={`Add deal to ${stage.label}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {adding && (
        <div class="deals-add-form">
          <input
            placeholder="Deal name"
            value={form.name}
            onInput={(e) => setForm({ ...form, name: (e.target as HTMLInputElement).value })}
            onKeyDown={(e) => e.key === "Enter" && submitAdd()}
            autoFocus
          />
          <select
            value={form.contact_id}
            onChange={(e) => setForm({ ...form, contact_id: (e.target as HTMLSelectElement).value })}
          >
            <option value="">Contact (optional)</option>
            {contactLookup.map((ct) => (
              <option key={ct.id} value={ct.id}>{ct.first_name} {ct.last_name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Value ($)"
            value={form.value}
            onInput={(e) => setForm({ ...form, value: (e.target as HTMLInputElement).value })}
          />
          <div class="deals-add-form-actions">
            <button class="btn btn-primary btn-sm" onClick={submitAdd}>Add</button>
            <button class="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {!adding && (
        <button
          class="deals-new-deal-btn"
          onClick={() => setAdding(true)}
          aria-label={`New deal in ${stage.label}`}
        >
          <Plus size={14} /> New Deal
        </button>
      )}

      <div class="deals-column-cards">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {deals.length > 0 && (
        <div class="deals-column-footer">
          {formatCurrency(totalValue)}
        </div>
      )}
    </div>
  );
}
