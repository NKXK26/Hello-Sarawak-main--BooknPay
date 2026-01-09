import React, { useState, useEffect } from 'react';
import { FaAngleLeft, FaAngleRight, FaSortUp, FaSortDown } from 'react-icons/fa';
import './PaginatedTable.css';

const PaginatedTable = ({ data = [], columns, rowsPerPage = 5, rowKey, enableCheckbox = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  // Set the initial sort configuration to sort by 'id' in descending order
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState([]);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    pageNumbers.push(1);
    if (currentPage > 3) {
      pageNumbers.push("...");
    }
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    if (currentPage < totalPages - 2) {
      pageNumbers.push("...");
    }
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    return (aValue < bValue ? -1 : 1) * (sortConfig.direction === 'asc' ? 1 : -1);
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(paginatedData.map((row) => row[rowKey]));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (row) => {
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.includes(row[rowKey])
        ? prevSelectedRows.filter((id) => id !== row[rowKey])
        : [...prevSelectedRows, row[rowKey]]
    );
  };

  useEffect(() => {
  setSortConfig((prev) => ({
    key: prev.key || 'id',
    direction: 'desc',
  }));
  setCurrentPage(1);
}, [data]);


  return (
    <div className="paginated-table">
      <table className="styled-table">
        <thead>
          <tr>
            {enableCheckbox && (
              <th>
                <input
                  type="checkbox"
                  checked={
                    paginatedData.length > 0 &&
                    paginatedData.every((row) => selectedRows.includes(row[rowKey]))
                  }
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th key={index} onClick={() => handleSort(column.accessor)} style={{ cursor: 'pointer' }}>
                {column.header}
                {sortConfig.key === column.accessor && (
                  <span className="sort-icon">
                    {sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, rowIndex) => (
              <tr key={row[rowKey] || rowIndex}>
                {enableCheckbox && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row[rowKey])}
                      onChange={() => handleSelectRow(row)}
                    />
                  </td>
                )}
                {columns.map((column, colIndex) => (
                  <td key={colIndex}>
                    {column.render ? column.render(row, rowIndex) : (row[column.accessor] || "N/A")}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (enableCheckbox ? 1 : 0)} style={{ textAlign: 'start' }}>
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FaAngleLeft />
          </button>

          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={index} className="ellipsis">...</span>
            ) : (
              <button
                key={index}
                className={currentPage === page ? 'active' : ''}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <FaAngleRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaginatedTable;
