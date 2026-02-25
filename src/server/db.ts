import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "..", "..", "data.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Auto-apply schema on startup
const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

// Seed data if empty
const companyCount = db.prepare("SELECT COUNT(*) as count FROM companies").get() as { count: number };
if (companyCount.count === 0) {
  const ins = {
    company: db.prepare("INSERT INTO companies (name, domain, industry, phone, email) VALUES (?, ?, ?, ?, ?)"),
    contact: db.prepare("INSERT INTO contacts (first_name, last_name, email, phone, company_id, title, status) VALUES (?, ?, ?, ?, ?, ?, ?)"),
    deal: db.prepare("INSERT INTO deals (name, contact_id, value, stage, close_date) VALUES (?, ?, ?, ?, ?)"),
  };

  const seed = db.transaction(() => {
    // Companies
    ins.company.run("Acme Corp", "acme.com", "Technology", "+1 555-0100", "info@acme.com");
    ins.company.run("Globex Inc", "globex.com", "Manufacturing", "+1 555-0200", "hello@globex.com");
    ins.company.run("Initech", "initech.com", "Software", "+1 555-0300", "contact@initech.com");
    ins.company.run("Umbrella Co", "umbrella.co", "Healthcare", "+1 555-0400", "info@umbrella.co");
    ins.company.run("Wayne Enterprises", "wayne.com", "Finance", "+1 555-0500", "info@wayne.com");

    // Contacts
    ins.contact.run("Alice", "Johnson", "alice@acme.com", "+1 555-0101", 1, "CEO", "active");
    ins.contact.run("Bob", "Smith", "bob@acme.com", "+1 555-0102", 1, "CTO", "active");
    ins.contact.run("Carol", "Williams", "carol@globex.com", "+1 555-0201", 2, "VP Sales", "active");
    ins.contact.run("David", "Brown", "david@initech.com", "+1 555-0301", 3, "Director", "lead");
    ins.contact.run("Eve", "Davis", "eve@umbrella.co", "+1 555-0401", 4, "Manager", "lead");
    ins.contact.run("Frank", "Miller", "frank@wayne.com", "+1 555-0501", 5, "CFO", "active");
    ins.contact.run("Grace", "Wilson", "grace@acme.com", "+1 555-0103", 1, "VP Engineering", "active");
    ins.contact.run("Hank", "Taylor", "hank@globex.com", "+1 555-0202", 2, "Buyer", "inactive");
    ins.contact.run("Ivy", "Anderson", "ivy@initech.com", "+1 555-0302", 3, "Analyst", "churned");
    ins.contact.run("Jack", "Thomas", "jack@wayne.com", "+1 555-0502", 5, "Procurement", "lead");

    // Deals
    ins.deal.run("Acme Enterprise License", 1, 120000, "negotiation", "2026-03-15");
    ins.deal.run("Globex Annual Contract", 3, 85000, "proposal", "2026-04-01");
    ins.deal.run("Initech Pilot Program", 4, 15000, "qualified", "2026-03-30");
    ins.deal.run("Umbrella Expansion", 5, 200000, "prospect", "2026-06-01");
    ins.deal.run("Wayne Security Suite", 6, 350000, "negotiation", "2026-03-20");
    ins.deal.run("Acme Support Renewal", 7, 45000, "won", "2026-02-01");
    ins.deal.run("Globex Consulting", 3, 30000, "lost", "2026-01-15");
    ins.deal.run("Wayne Analytics Platform", 10, 95000, "qualified", "2026-05-01");
  });
  seed();
}

export function query<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function get<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
  return db.transaction(fn)();
}
