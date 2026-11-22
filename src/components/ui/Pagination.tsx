import { useState, useEffect, useMemo } from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showEllipsis?: boolean;
}

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showEllipsis = true,
}: PaginationProps) => {
  const [currentPageLocal, setCurrentPageLocal] = useState(currentPage);

  useEffect(() => {
    setCurrentPageLocal(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPageLocal(page);
    onPageChange(page);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7 || !showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5);
      if (totalPages > 5) {
        pages.push('ellipsis', totalPages);
      }
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      if (totalPages > 6) {
        pages.push('ellipsis');
      }
      pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1);
      pages.push('ellipsis');
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = useMemo(() => getPageNumbers(), [totalPages, currentPage, showEllipsis]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:hover:bg-gray-800 disabled:hover:border-gray-700 transition-all"
        aria-label="Previous page"
      >
        ←
      </button>

      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-gray-400 select-none"
            >
              ...
            </span>
          );
        }
        return (
          <button
            key={index}
            onClick={() => handlePageChange(page as number)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              currentPage === page
                ? 'bg-red-600 text-white border border-red-500'
                : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:hover:bg-gray-800 disabled:hover:border-gray-700 transition-all"
        aria-label="Next page"
      >
        →
      </button>

      <div className="ml-4 text-sm text-gray-400">
        Trang {currentPage} / {totalPages} - {totalItems} video
      </div>
    </div>
  );
};

export { Pagination };
