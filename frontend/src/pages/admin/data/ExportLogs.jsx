import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
} from "lucide-react";

const ExportLogs = ({ selectedBranch }) => {
  // Dummy Export Logs Data
  const [logs] = useState([
    { id: 1, date: "2025-10-01", user: "Admin", type: "Excel", data: "All Cases", branch: "Sanjay Diagnostics", status: "Success", size: "2.3 MB" },
    { id: 2, date: "2025-10-02", user: "Dr. Ramesh", type: "PDF", data: "Monthly Report", branch: "PrimeCare Diagnostics", status: "Success", size: "1.1 MB" },
    { id: 3, date: "2025-10-02", user: "Admin", type: "CSV", data: "Agent List", branch: "RapidTest Express", status: "Success", size: "540 KB" },
    { id: 4, date: "2025-10-03", user: "Technician A", type: "Excel", data: "Transactions", branch: "HealthPoint Diagnostics", status: "Failed", size: "--" },
    { id: 5, date: "2025-10-04", user: "Admin", type: "Excel", data: "Doctor Database", branch: "Sanjay Diagnostics", status: "Success", size: "800 KB" },
    { id: 6, date: "2025-10-04", user: "Dr. Ramesh", type: "PDF", data: "Daily Reports", branch: "Viva Labs", status: "Success", size: "1.5 MB" },
    { id: 7, date: "2025-10-05", user: "Admin", type: "Excel", data: "Cases Backup", branch: "RapidTest Express", status: "Success", size: "5.2 MB" },
    { id: 8, date: "2025-10-05", user: "Technician B", type: "CSV", data: "Test Packages", branch: "PrimeCare Diagnostics", status: "Success", size: "700 KB" },
    { id: 9, date: "2025-10-05", user: "Admin", type: "Excel", data: "Patient List", branch: "Sanjay Diagnostics", status: "Success", size: "3.4 MB" },
    { id: 10, date: "2025-10-05", user: "Technician A", type: "PDF", data: "Billing Summary", branch: "HealthPoint Diagnostics", status: "Failed", size: "--" },
  ]);

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  // Filter + Search Logic
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (selectedBranch) {
      result = result.filter((log) => log.branch === selectedBranch.name);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.user.toLowerCase().includes(term) ||
          l.data.toLowerCase().includes(term) ||
          l.branch.toLowerCase().includes(term)
      );
    }

    if (filters.type) {
      result = result.filter((l) => l.type === filters.type);
    }

    if (filters.status) {
      result = result.filter((l) => l.status === filters.status);
    }

    return result;
  }, [logs, filters, selectedBranch]);

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleDownloadLog = () => {
    alert("Export log downloaded (simulation)");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <FileText className="w-6 h-6 text-blue-600" /> Export Logs
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg mb-6 border">
        <div className="flex items-center bg-white border rounded-md px-3 py-1 w-64">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search by user, data or branch..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="w-full outline-none text-sm"
          />
        </div>

        <select
          className="border rounded-md px-3 py-1 text-sm bg-white"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="Excel">Excel</option>
          <option value="PDF">PDF</option>
          <option value="CSV">CSV</option>
        </select>

        <select
          className="border rounded-md px-3 py-1 text-sm bg-white"
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">All Status</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </select>

        <button
          onClick={() => {
            setFilters({ search: "", type: "", status: "" });
          }}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
        >
          <Filter className="w-4 h-4" /> Reset
        </button>

        <button
          onClick={handleDownloadLog}
          className="ml-auto flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Download Logs
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">User</th>
              <th className="border p-2">Data Exported</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Branch</th>
              <th className="border p-2">Size</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No export logs found
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 border-b text-gray-700"
                >
                  <td className="p-2 text-gray-600">{log.date}</td>
                  <td className="p-2 font-medium">{log.user}</td>
                  <td className="p-2">{log.data}</td>
                  <td className="p-2">{log.type}</td>
                  <td className="p-2">{log.branch}</td>
                  <td className="p-2 text-gray-600">{log.size}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        log.status === "Success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </button>

        <span>
          Page {page} of {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default ExportLogs;

