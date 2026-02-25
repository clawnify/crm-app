import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { View, Contact, Company, Deal, Stats, PaginatedState, CompanyLookup, ContactLookup } from "./types";

export interface CrmContextValue {
  view: View;
  setView: (v: View) => void;
  isAgent: boolean;
  stats: Stats;

  // Contacts
  contacts: Contact[];
  contactsPag: PaginatedState;
  setContactsPage: (page: number) => void;
  setContactsSort: (col: string) => void;
  setContactsSearch: (search: string) => void;
  addContact: (data: Partial<Contact>) => Promise<void>;
  updateContact: (id: number, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: number) => Promise<void>;

  // Companies
  companies: Company[];
  companiesPag: PaginatedState;
  setCompaniesPage: (page: number) => void;
  setCompaniesSort: (col: string) => void;
  setCompaniesSearch: (search: string) => void;
  addCompany: (data: Partial<Company>) => Promise<void>;
  updateCompany: (id: number, data: Partial<Company>) => Promise<void>;
  deleteCompany: (id: number) => Promise<void>;

  // Deals
  deals: Deal[];
  dealsPag: PaginatedState;
  dealsTotalValue: number;
  setDealsPage: (page: number) => void;
  setDealsSort: (col: string) => void;
  setDealsSearch: (search: string) => void;
  addDeal: (data: Partial<Deal>) => Promise<void>;
  updateDeal: (id: number, data: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: number) => Promise<void>;
  boardDeals: Deal[];

  // Lookups
  companyLookup: CompanyLookup[];
  contactLookup: ContactLookup[];

  loading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
}

export const CrmContext = createContext<CrmContextValue>(null!);

export function useCrm() {
  return useContext(CrmContext);
}
