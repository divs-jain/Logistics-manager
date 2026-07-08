import { useState, useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";

export function usePagination(items, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Ensure current page is valid when items change
  const validPage = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)));
  
  if (currentPage !== validPage) {
    setCurrentPage(validPage);
  }

  const currentItems = useMemo(() => {
    const start = (validPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, validPage, itemsPerPage]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="py-4 border-t border-slate-100 bg-white">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (validPage > 1) setCurrentPage(validPage - 1);
                }} 
                className={validPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              // Show a few pages around current
              if (page === 1 || page === totalPages || (page >= validPage - 1 && page <= validPage + 1)) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      href="#" 
                      isActive={page === validPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              if (page === validPage - 2 || page === validPage + 2) {
                return <PaginationItem key={page}><span className="text-slate-400 px-2">...</span></PaginationItem>;
              }
              return null;
            })}

            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (validPage < totalPages) setCurrentPage(validPage + 1);
                }} 
                className={validPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return { currentItems, renderPagination, setCurrentPage };
}
