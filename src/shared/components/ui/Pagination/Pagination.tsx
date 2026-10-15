'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  itemLabel?: string;
  disabled?: boolean;
}

// Devolve as páginas a mostrar, com reticências quando há muitas
function getPageItems(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push('ellipsis');
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 1) items.push('ellipsis');

  items.push(totalPages);
  return items;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  itemLabel = 'registos',
  disabled = false,
}) => {
  if (total === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className={styles.pagination} aria-label="Paginação">
      <span className={styles.summary}>
        {from}–{to} de {total} {itemLabel}
      </span>

      <div className={styles.controls}>
        {onLimitChange && (
          <select
            className={styles.limitSelect}
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={disabled}
            aria-label="Registos por página"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option} / página
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          className={styles.pageButton}
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageItems(page, safeTotalPages).map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`${styles.pageButton} ${item === page ? styles.active : ''}`}
              onClick={() => onPageChange(item)}
              disabled={disabled}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className={styles.pageButton}
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= safeTotalPages}
          aria-label="Página seguinte"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
};
