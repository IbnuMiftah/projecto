/**
 * Shared pagination component used across data pages.
 * Renders page info, prev/next buttons, and page number buttons with ellipsis.
 *
 * @param {number} currentPage - Current active page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Items per page
 * @param {Function} onPageChange - Callback when page changes
 * @param {string} [itemLabel='items'] - Label for the items (e.g., 'members', 'beneficiaries')
 */
export default function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, itemLabel = 'items' }) {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="data-page__pagination">
      <span className="data-page__pagination-info">
        Showing {start} to {end} of {totalItems.toLocaleString()} {itemLabel}
      </span>
      <div className="data-page__pagination-controls">
        <button className="data-page__page-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>‹ Previous</button>
        {pages.map((p, i) =>
          p === '...' ? <span key={`e${i}`} className="data-page__page-ellipsis">…</span> :
          <button key={p} className={`data-page__page-btn ${currentPage === p ? 'data-page__page-btn--active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button className="data-page__page-btn" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Next ›</button>
      </div>
    </div>
  );
}
