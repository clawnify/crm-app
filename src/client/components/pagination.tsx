import { ChevronLeft, ChevronRight } from "lucide-preact";
import type { PaginatedState } from "../types";

interface PaginationProps {
  pag: PaginatedState;
  onPage: (page: number) => void;
}

export function Pagination({ pag, onPage }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(pag.total / pag.limit));
  const from = (pag.page - 1) * pag.limit + 1;
  const to = Math.min(pag.page * pag.limit, pag.total);

  if (pag.total === 0) return null;

  return (
    <div class="pagination">
      <span>
        {from}–{to} of {pag.total}
      </span>
      <div class="pagination-controls">
        <button
          class="btn btn-sm"
          disabled={pag.page <= 1}
          onClick={() => onPage(pag.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span>Page {pag.page} of {totalPages}</span>
        <button
          class="btn btn-sm"
          disabled={pag.page >= totalPages}
          onClick={() => onPage(pag.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
