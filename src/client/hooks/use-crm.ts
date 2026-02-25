import { useState, useCallback, useEffect } from "preact/hooks";
import { api } from "../api";
import type {
  View, Contact, Company, Deal, Stats, PaginatedState,
  CompanyLookup, ContactLookup,
} from "../types";
import type { CrmContextValue } from "../context";

const defaultPag = (sort: string): PaginatedState => ({
  page: 1, limit: 25, total: 0, sort, order: "desc", search: "",
});

export function useCrmState(isAgent: boolean): CrmContextValue {
  const [view, setView] = useState<View>("contacts");
  const [stats, setStats] = useState<Stats>({ contacts: 0, companies: 0, deals: 0, dealValue: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsPag, setContactsPag] = useState<PaginatedState>(defaultPag("id"));

  // Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesPag, setCompaniesPag] = useState<PaginatedState>(defaultPag("id"));

  // Deals
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsPag, setDealsPag] = useState<PaginatedState>(defaultPag("id"));
  const [dealsTotalValue, setDealsTotalValue] = useState(0);

  // Lookups
  const [companyLookup, setCompanyLookup] = useState<CompanyLookup[]>([]);
  const [contactLookup, setContactLookup] = useState<ContactLookup[]>([]);

  // ── Fetch helpers ──

  const fetchStats = useCallback(async () => {
    const data = await api<Stats>("GET", "/api/stats");
    setStats(data);
  }, []);

  const fetchContacts = useCallback(async (pag: PaginatedState) => {
    const params = new URLSearchParams({
      page: String(pag.page),
      limit: String(pag.limit),
      sort: pag.sort,
      order: pag.order,
    });
    if (pag.search) params.set("search", pag.search);

    const data = await api<{ contacts: Contact[]; total: number }>("GET", `/api/contacts?${params}`);
    setContacts(data.contacts);
    setContactsPag((prev) => ({ ...prev, total: data.total }));
  }, []);

  const fetchCompanies = useCallback(async (pag: PaginatedState) => {
    const params = new URLSearchParams({
      page: String(pag.page),
      limit: String(pag.limit),
      sort: pag.sort,
      order: pag.order,
    });
    if (pag.search) params.set("search", pag.search);

    const data = await api<{ companies: Company[]; total: number }>("GET", `/api/companies?${params}`);
    setCompanies(data.companies);
    setCompaniesPag((prev) => ({ ...prev, total: data.total }));
  }, []);

  const fetchDeals = useCallback(async (pag: PaginatedState) => {
    const params = new URLSearchParams({
      page: String(pag.page),
      limit: String(pag.limit),
      sort: pag.sort,
      order: pag.order,
    });
    if (pag.search) params.set("search", pag.search);

    const data = await api<{ deals: Deal[]; total: number; totalValue: number }>("GET", `/api/deals?${params}`);
    setDeals(data.deals);
    setDealsPag((prev) => ({ ...prev, total: data.total }));
    setDealsTotalValue(data.totalValue);
  }, []);

  const fetchLookups = useCallback(async () => {
    const [co, ct] = await Promise.all([
      api<{ companies: CompanyLookup[] }>("GET", "/api/companies/all"),
      api<{ contacts: ContactLookup[] }>("GET", "/api/contacts/all"),
    ]);
    setCompanyLookup(co.companies);
    setContactLookup(ct.contacts);
  }, []);

  // ── Initial load ──

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStats(),
          fetchContacts(contactsPag),
          fetchCompanies(companiesPag),
          fetchDeals(dealsPag),
          fetchLookups(),
        ]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Refetch on pagination/sort/search changes ──

  const refreshCurrentView = useCallback(async () => {
    try {
      if (view === "contacts") await fetchContacts(contactsPag);
      else if (view === "companies") await fetchCompanies(companiesPag);
      else await fetchDeals(dealsPag);
      await fetchStats();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [view, contactsPag, companiesPag, dealsPag, fetchContacts, fetchCompanies, fetchDeals, fetchStats]);

  useEffect(() => {
    refreshCurrentView();
  }, [contactsPag.page, contactsPag.sort, contactsPag.order, contactsPag.search,
      companiesPag.page, companiesPag.sort, companiesPag.order, companiesPag.search,
      dealsPag.page, dealsPag.sort, dealsPag.order, dealsPag.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Contacts CRUD ──

  const setContactsPage = useCallback((page: number) => {
    setContactsPag((prev) => ({ ...prev, page }));
  }, []);

  const setContactsSort = useCallback((col: string) => {
    setContactsPag((prev) => ({
      ...prev,
      sort: col,
      order: prev.sort === col && prev.order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }, []);

  const setContactsSearch = useCallback((search: string) => {
    setContactsPag((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const addContact = useCallback(async (data: Partial<Contact>) => {
    await api("POST", "/api/contacts", data);
    await fetchContacts(contactsPag);
    await Promise.all([fetchStats(), fetchLookups()]);
  }, [contactsPag, fetchContacts, fetchStats, fetchLookups]);

  const updateContact = useCallback(async (id: number, data: Partial<Contact>) => {
    await api("PUT", `/api/contacts/${id}`, data);
    await fetchContacts(contactsPag);
    await fetchLookups();
  }, [contactsPag, fetchContacts, fetchLookups]);

  const deleteContact = useCallback(async (id: number) => {
    await api("DELETE", `/api/contacts/${id}`);
    await fetchContacts(contactsPag);
    await Promise.all([fetchStats(), fetchLookups()]);
  }, [contactsPag, fetchContacts, fetchStats, fetchLookups]);

  // ── Companies CRUD ──

  const setCompaniesPage = useCallback((page: number) => {
    setCompaniesPag((prev) => ({ ...prev, page }));
  }, []);

  const setCompaniesSort = useCallback((col: string) => {
    setCompaniesPag((prev) => ({
      ...prev,
      sort: col,
      order: prev.sort === col && prev.order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }, []);

  const setCompaniesSearch = useCallback((search: string) => {
    setCompaniesPag((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const addCompany = useCallback(async (data: Partial<Company>) => {
    await api("POST", "/api/companies", data);
    await fetchCompanies(companiesPag);
    await Promise.all([fetchStats(), fetchLookups()]);
  }, [companiesPag, fetchCompanies, fetchStats, fetchLookups]);

  const updateCompany = useCallback(async (id: number, data: Partial<Company>) => {
    await api("PUT", `/api/companies/${id}`, data);
    await fetchCompanies(companiesPag);
    await fetchLookups();
  }, [companiesPag, fetchCompanies, fetchLookups]);

  const deleteCompany = useCallback(async (id: number) => {
    await api("DELETE", `/api/companies/${id}`);
    await fetchCompanies(companiesPag);
    await Promise.all([fetchStats(), fetchLookups()]);
  }, [companiesPag, fetchCompanies, fetchStats, fetchLookups]);

  // ── Deals CRUD ──

  const setDealsPage = useCallback((page: number) => {
    setDealsPag((prev) => ({ ...prev, page }));
  }, []);

  const setDealsSort = useCallback((col: string) => {
    setDealsPag((prev) => ({
      ...prev,
      sort: col,
      order: prev.sort === col && prev.order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }, []);

  const setDealsSearch = useCallback((search: string) => {
    setDealsPag((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const addDeal = useCallback(async (data: Partial<Deal>) => {
    await api("POST", "/api/deals", data);
    await fetchDeals(dealsPag);
    await fetchStats();
  }, [dealsPag, fetchDeals, fetchStats]);

  const updateDeal = useCallback(async (id: number, data: Partial<Deal>) => {
    await api("PUT", `/api/deals/${id}`, data);
    await fetchDeals(dealsPag);
    await fetchStats();
  }, [dealsPag, fetchDeals, fetchStats]);

  const deleteDeal = useCallback(async (id: number) => {
    await api("DELETE", `/api/deals/${id}`);
    await fetchDeals(dealsPag);
    await fetchStats();
  }, [dealsPag, fetchDeals, fetchStats]);

  return {
    view, setView, isAgent, stats,
    contacts, contactsPag, setContactsPage, setContactsSort, setContactsSearch,
    addContact, updateContact, deleteContact,
    companies, companiesPag, setCompaniesPage, setCompaniesSort, setCompaniesSearch,
    addCompany, updateCompany, deleteCompany,
    deals, dealsPag, dealsTotalValue, setDealsPage, setDealsSort, setDealsSearch,
    addDeal, updateDeal, deleteDeal,
    companyLookup, contactLookup,
    loading, error, setError,
  };
}
