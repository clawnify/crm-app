import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { query, get, run } from "./db";

const app = new Hono();

// ── Stats ────────────────────────────────────────────────────────────

app.get("/api/stats", (c) => {
  try {
    const contacts = get<{ count: number }>("SELECT COUNT(*) as count FROM contacts");
    const companies = get<{ count: number }>("SELECT COUNT(*) as count FROM companies");
    const deals = get<{ count: number }>("SELECT COUNT(*) as count FROM deals");
    const dealValue = get<{ total: number }>("SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE stage NOT IN ('lost')");
    return c.json({
      contacts: contacts?.count || 0,
      companies: companies?.count || 0,
      deals: deals?.count || 0,
      dealValue: dealValue?.total || 0,
    });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── Companies ────────────────────────────────────────────────────────

app.get("/api/companies", (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "25", 10)));
    const offset = (page - 1) * limit;
    const search = (c.req.query("search") || "").trim();
    const industry = (c.req.query("industry") || "").trim();

    let sortCol = c.req.query("sort") || "id";
    if (!["id", "name", "domain", "industry", "created_at"].includes(sortCol)) sortCol = "id";
    let order = (c.req.query("order") || "desc").toLowerCase();
    if (order !== "asc" && order !== "desc") order = "desc";

    const where: string[] = [];
    const params: unknown[] = [];

    if (search) {
      where.push("(name LIKE ? OR domain LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (industry) {
      where.push("industry = ?");
      params.push(industry);
    }

    const whereSQL = where.length ? " WHERE " + where.join(" AND ") : "";

    const countResult = get<{ total: number }>(
      "SELECT COUNT(*) as total FROM companies" + whereSQL,
      ...params,
    );
    const total = countResult?.total || 0;

    const rows = query(
      `SELECT c.*, (SELECT COUNT(*) FROM contacts WHERE company_id = c.id) as contact_count
       FROM companies c${whereSQL} ORDER BY c.${sortCol} ${order} LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset,
    );

    return c.json({ companies: rows, total, page, limit });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post("/api/companies", async (c) => {
  try {
    const body = await c.req.json();
    const name = (body.name || "").trim();
    if (!name) return c.json({ error: "Name is required" }, 400);

    run(
      "INSERT INTO companies (name, domain, industry, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?)",
      name,
      (body.domain || "").trim(),
      (body.industry || "").trim(),
      (body.phone || "").trim(),
      (body.email || "").trim(),
      (body.notes || "").trim(),
    );

    const inserted = get("SELECT * FROM companies WHERE rowid = last_insert_rowid()");
    return c.json({ company: inserted }, 201);
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.put("/api/companies/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

    const body = await c.req.json();
    const fields: string[] = [];
    const params: unknown[] = [];

    for (const key of ["name", "domain", "industry", "phone", "email", "notes"]) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(typeof body[key] === "string" ? body[key].trim() : body[key]);
      }
    }

    if (fields.length === 0) return c.json({ error: "No fields to update" }, 400);
    fields.push("updated_at = datetime('now')");
    params.push(id);

    const result = run("UPDATE companies SET " + fields.join(", ") + " WHERE id = ?", ...params);
    if (result.changes === 0) return c.json({ error: "Company not found" }, 404);

    const updated = get("SELECT * FROM companies WHERE id = ?", id);
    return c.json({ company: updated });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.delete("/api/companies/:id", (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

    const result = run("DELETE FROM companies WHERE id = ?", id);
    if (result.changes === 0) return c.json({ error: "Company not found" }, 404);
    return c.json({ ok: true });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── Contacts ─────────────────────────────────────────────────────────

app.get("/api/contacts", (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "25", 10)));
    const offset = (page - 1) * limit;
    const search = (c.req.query("search") || "").trim();
    const status = (c.req.query("status") || "").trim();
    const companyId = c.req.query("company_id") || "";

    let sortCol = c.req.query("sort") || "id";
    if (!["id", "first_name", "last_name", "email", "status", "company_id", "created_at"].includes(sortCol)) sortCol = "id";
    let order = (c.req.query("order") || "desc").toLowerCase();
    if (order !== "asc" && order !== "desc") order = "desc";

    const where: string[] = [];
    const params: unknown[] = [];

    if (search) {
      where.push("(ct.first_name LIKE ? OR ct.last_name LIKE ? OR ct.email LIKE ? OR ct.title LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      where.push("ct.status = ?");
      params.push(status);
    }
    if (companyId) {
      where.push("ct.company_id = ?");
      params.push(parseInt(companyId, 10));
    }

    const whereSQL = where.length ? " WHERE " + where.join(" AND ") : "";

    const countResult = get<{ total: number }>(
      "SELECT COUNT(*) as total FROM contacts ct" + whereSQL,
      ...params,
    );
    const total = countResult?.total || 0;

    const sortPrefix = ["id", "first_name", "last_name", "email", "status", "company_id", "created_at"].includes(sortCol) ? "ct." : "";

    const rows = query(
      `SELECT ct.*, co.name as company_name, co.domain as company_domain
       FROM contacts ct
       LEFT JOIN companies co ON ct.company_id = co.id
       ${whereSQL}
       ORDER BY ${sortPrefix}${sortCol} ${order}
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset,
    );

    return c.json({ contacts: rows, total, page, limit });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post("/api/contacts", async (c) => {
  try {
    const body = await c.req.json();
    const firstName = (body.first_name || "").trim();
    if (!firstName) return c.json({ error: "First name is required" }, 400);

    const companyId = body.company_id ? parseInt(body.company_id, 10) : null;

    run(
      "INSERT INTO contacts (first_name, last_name, email, phone, company_id, title, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      firstName,
      (body.last_name || "").trim(),
      (body.email || "").trim(),
      (body.phone || "").trim(),
      companyId,
      (body.title || "").trim(),
      (body.status || "lead").trim(),
    );

    const inserted = get(
      `SELECT ct.*, co.name as company_name, co.domain as company_domain
       FROM contacts ct LEFT JOIN companies co ON ct.company_id = co.id
       WHERE ct.rowid = last_insert_rowid()`,
    );
    return c.json({ contact: inserted }, 201);
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.put("/api/contacts/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

    const body = await c.req.json();
    const fields: string[] = [];
    const params: unknown[] = [];

    for (const key of ["first_name", "last_name", "email", "phone", "title", "status"]) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(typeof body[key] === "string" ? body[key].trim() : body[key]);
      }
    }
    if (body.company_id !== undefined) {
      fields.push("company_id = ?");
      params.push(body.company_id ? parseInt(body.company_id, 10) : null);
    }

    if (fields.length === 0) return c.json({ error: "No fields to update" }, 400);
    fields.push("updated_at = datetime('now')");
    params.push(id);

    const result = run("UPDATE contacts SET " + fields.join(", ") + " WHERE id = ?", ...params);
    if (result.changes === 0) return c.json({ error: "Contact not found" }, 404);

    const updated = get(
      `SELECT ct.*, co.name as company_name, co.domain as company_domain
       FROM contacts ct LEFT JOIN companies co ON ct.company_id = co.id
       WHERE ct.id = ?`,
      id,
    );
    return c.json({ contact: updated });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.delete("/api/contacts/:id", (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

    const result = run("DELETE FROM contacts WHERE id = ?", id);
    if (result.changes === 0) return c.json({ error: "Contact not found" }, 404);
    return c.json({ ok: true });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── Deals ────────────────────────────────────────────────────────────

app.get("/api/deals/board", (c) => {
  try {
    const rows = query(
      `SELECT d.*,
              ct.first_name as contact_first_name, ct.last_name as contact_last_name,
              co.name as company_name, co.domain as company_domain
       FROM deals d
       LEFT JOIN contacts ct ON d.contact_id = ct.id
       LEFT JOIN companies co ON ct.company_id = co.id
       ORDER BY d.created_at ASC`,
    );
    return c.json({ deals: rows });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.get("/api/deals", (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "25", 10)));
    const offset = (page - 1) * limit;
    const search = (c.req.query("search") || "").trim();
    const stage = (c.req.query("stage") || "").trim();
    const contactId = c.req.query("contact_id") || "";

    let sortCol = c.req.query("sort") || "id";
    if (!["id", "name", "value", "stage", "close_date", "created_at"].includes(sortCol)) sortCol = "id";
    let order = (c.req.query("order") || "desc").toLowerCase();
    if (order !== "asc" && order !== "desc") order = "desc";

    const where: string[] = [];
    const params: unknown[] = [];

    if (search) {
      where.push("(d.name LIKE ? OR d.notes LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (stage) {
      where.push("d.stage = ?");
      params.push(stage);
    }
    if (contactId) {
      where.push("d.contact_id = ?");
      params.push(parseInt(contactId, 10));
    }

    const whereSQL = where.length ? " WHERE " + where.join(" AND ") : "";

    const countResult = get<{ total: number }>(
      "SELECT COUNT(*) as total FROM deals d" + whereSQL,
      ...params,
    );
    const total = countResult?.total || 0;

    // Also get aggregate value for footer
    const aggParams = [...params];
    const agg = get<{ total_value: number }>(
      "SELECT COALESCE(SUM(d.value), 0) as total_value FROM deals d" + whereSQL,
      ...aggParams,
    );

    const rows = query(
      `SELECT d.*,
              ct.first_name as contact_first_name, ct.last_name as contact_last_name,
              co.name as company_name, co.domain as company_domain
       FROM deals d
       LEFT JOIN contacts ct ON d.contact_id = ct.id
       LEFT JOIN companies co ON ct.company_id = co.id
       ${whereSQL}
       ORDER BY d.${sortCol} ${order}
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset,
    );

    return c.json({ deals: rows, total, page, limit, totalValue: agg?.total_value || 0 });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.post("/api/deals", async (c) => {
  try {
    const body = await c.req.json();
    const name = (body.name || "").trim();
    if (!name) return c.json({ error: "Name is required" }, 400);

    const contactId = body.contact_id ? parseInt(body.contact_id, 10) : null;
    const value = parseFloat(body.value) || 0;

    run(
      "INSERT INTO deals (name, contact_id, value, stage, close_date, notes) VALUES (?, ?, ?, ?, ?, ?)",
      name,
      contactId,
      value,
      (body.stage || "prospect").trim(),
      (body.close_date || "").trim(),
      (body.notes || "").trim(),
    );

    const inserted = get(
      `SELECT d.*, ct.first_name as contact_first_name, ct.last_name as contact_last_name,
              co.name as company_name, co.domain as company_domain
       FROM deals d
       LEFT JOIN contacts ct ON d.contact_id = ct.id
       LEFT JOIN companies co ON ct.company_id = co.id
       WHERE d.rowid = last_insert_rowid()`,
    );
    return c.json({ deal: inserted }, 201);
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.put("/api/deals/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

    const body = await c.req.json();
    const fields: string[] = [];
    const params: unknown[] = [];

    for (const key of ["name", "stage", "close_date", "notes"]) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(typeof body[key] === "string" ? body[key].trim() : body[key]);
      }
    }
    if (body.value !== undefined) {
      fields.push("value = ?");
      params.push(parseFloat(body.value) || 0);
    }
    if (body.contact_id !== undefined) {
      fields.push("contact_id = ?");
      params.push(body.contact_id ? parseInt(body.contact_id, 10) : null);
    }

    if (fields.length === 0) return c.json({ error: "No fields to update" }, 400);
    fields.push("updated_at = datetime('now')");
    params.push(id);

    const result = run("UPDATE deals SET " + fields.join(", ") + " WHERE id = ?", ...params);
    if (result.changes === 0) return c.json({ error: "Deal not found" }, 404);

    const updated = get(
      `SELECT d.*, ct.first_name as contact_first_name, ct.last_name as contact_last_name,
              co.name as company_name, co.domain as company_domain
       FROM deals d
       LEFT JOIN contacts ct ON d.contact_id = ct.id
       LEFT JOIN companies co ON ct.company_id = co.id
       WHERE d.id = ?`,
      id,
    );
    return c.json({ deal: updated });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.delete("/api/deals/:id", (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);

    const result = run("DELETE FROM deals WHERE id = ?", id);
    if (result.changes === 0) return c.json({ error: "Deal not found" }, 404);
    return c.json({ ok: true });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// ── Lookup endpoints (for select dropdowns) ──────────────────────────

app.get("/api/companies/all", (c) => {
  try {
    const companies = query("SELECT id, name, domain FROM companies ORDER BY name ASC");
    return c.json({ companies });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

app.get("/api/contacts/all", (c) => {
  try {
    const contacts = query(
      `SELECT ct.id, ct.first_name, ct.last_name, co.name as company_name, co.domain as company_domain
       FROM contacts ct LEFT JOIN companies co ON ct.company_id = co.id ORDER BY ct.first_name ASC`,
    );
    return c.json({ contacts });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

// Production: serve Vite build output
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ root: "./dist", path: "index.html" }));
}

const port = parseInt(process.env.PORT || "3003", 10);
console.log(`CRM API running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });

export default app;
