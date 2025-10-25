import React, { useState, useEffect, useContext } from "react";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { LabContext } from "../../../context/LabContext";
import axios from "axios";

const ApproveBranch = ({ selectedBranch }) => {
  const { adminToken, errorToast, successToast } = useContext(LabContext);

  const [requests, setRequests] = useState([]);
  const [typeFilter, setTypeFilter] = useState("categories"); // categories, panels, tests, packages
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Fetch requests from API
  useEffect(() => {
    const fetchRequests = async () => {
      if (!adminToken) return;

      try {
        // Determine base URL
        let url = `${import.meta.env.VITE_API_URL}/api/test/category/admin/requests`;
        if (typeFilter === "panels") url = `${import.meta.env.VITE_API_URL}/api/test/panels/admin/requests`;
        else if (typeFilter === "tests") url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/requests`;
        else if (typeFilter === "packages") url = `${import.meta.env.VITE_API_URL}/api/test/packages/admin/requests`;

        // Add branchId param only if branch is selected
        const params = selectedBranch ? { branchId: selectedBranch._id } : {};

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${adminToken}` },
          params,
        });

        if (res.data.success) setRequests(res.data.requests || []);
      } catch (err) {
        console.error(err);
        errorToast?.("Failed to fetch requests");
      }
    };

    fetchRequests();
  }, [adminToken, selectedBranch, typeFilter, errorToast]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/test/category/admin/requests/${id}`;
      if (typeFilter === "panels") url = `${import.meta.env.VITE_API_URL}/api/test/panels/admin/requests/${id}`;
      else if (typeFilter === "tests") url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/requests/${id}`;
      else if (typeFilter === "packages") url = `${import.meta.env.VITE_API_URL}/api/test/packages/admin/requests/${id}`;

      const res = await axios.put(
        url,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        successToast?.(`Request ${newStatus.toLowerCase()} successfully`);
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
        );
      } else errorToast?.(res.data.message || "Failed to update status");
    } catch (err) {
      console.error(err);
      errorToast?.("Failed to update status");
    }
  };

  // Filters
  const filteredRequests = requests.filter((r) => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const paginatedRequests = filteredRequests.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Approve Branch Requests{" "}
        {selectedBranch ? (
          <span className="text-sm text-gray-500">— {selectedBranch.name}</span>
        ) : (
          <span className="text-sm text-gray-400">(All branches)</span>
        )}
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded-md"
        >
          <option value="">All</option>
          <option value="categories">Categories</option>
          <option value="panels">Panels</option>
          <option value="tests">Tests</option>
          <option value="packages">Packages</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded-md"
        >
          <option value="">All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>

        <div className="flex items-center border rounded-md p-2">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name..."
            className="outline-none flex-1"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              {typeFilter === "tests" && (
                <th className="border p-2">Type</th>
              )}
              {typeFilter === "panels" && (
                <th className="border p-2">Tests</th>
              )}
              <th className="border p-2">Status</th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRequests.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="border p-2">{r.name}</td>
                {typeFilter === "tests" && (
                  <td className="border p-2">{r.type}</td>
                )}
                {typeFilter === "panels" && (
  <td className="border p-2">
    {Array.isArray(r.tests) && r.tests.length > 0 ? (
      r.tests.map((t, i) => (
        <span key={t._id || i} className="inline-block mr-2">
          {t.name} ({t.shortName})
        </span>
      ))
    ) : (
      <span className="text-gray-400">No tests</span>
    )}
  </td>
)}

                <td className="border p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      r.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : r.status === "Rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="border p-2 flex gap-2 justify-center">
                  <button
                    onClick={() => handleStatusChange(r._id, "Approved")}
                    disabled={r.status === "Approved"}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(r._id, "Rejected")}
                    disabled={r.status === "Rejected"}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </td>
              </tr>
            ))}
            {paginatedRequests.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center text-gray-500 p-3">
                  No requests found
                </td>
              </tr>
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
          Page {page} of {Math.ceil(filteredRequests.length / rowsPerPage) || 1}
        </span>
        <button
          disabled={page === Math.ceil(filteredRequests.length / rowsPerPage)}
          onClick={() => setPage((p) => p + 1)}
          className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default ApproveBranch;
