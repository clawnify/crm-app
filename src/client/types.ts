export type View = "contacts" | "companies" | "deals";

export interface Company {
  id: number;
  name: string;
  domain: string;
  industry: string;
  phone: string;
  email: string;
  notes: string;
  contact_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: number | null;
  title: string;
  status: string;
  company_name?: string;
  company_domain?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  name: string;
  contact_id: number | null;
  value: number;
  stage: string;
  close_date: string;
  notes: string;
  contact_first_name?: string;
  contact_last_name?: string;
  company_name?: string;
  company_domain?: string;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  contacts: number;
  companies: number;
  deals: number;
  dealValue: number;
}

export interface PaginatedState {
  page: number;
  limit: number;
  total: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
}

export interface CompanyLookup {
  id: number;
  name: string;
  domain: string;
}

export interface ContactLookup {
  id: number;
  first_name: string;
  last_name: string;
  company_name?: string;
  company_domain?: string;
}
