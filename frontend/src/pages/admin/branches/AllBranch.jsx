import React, { useState, useEffect, useContext } from "react";
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Edit,
  MapPin,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";


const AllBranch = () => {
  const navigate = useNavigate();
  const { adminToken, successToast } = useContext(LabContext);

  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const rowsPerPage = 5;

  // 🔹 Fetch all branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await axios.get( `${import.meta.env.VITE_API_URL}/api/admin/branch/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      
      
      setBranches(res.data.branches || []);
    } catch (err) {
      successToast("Failed to load branches", "error");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Toggle Branch Active/Inactive
  const toggleStatus = async (id) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/branch/toggle/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      successToast(res.data.message, "success");
      fetchBranches(); // refresh list
    } catch (err) {
      successToast("Failed to toggle branch status", "error");
    }
  };

  // 🔹 Initial load
  useEffect(() => {
    fetchBranches();
  }, []);

  // 🔹 Filtering logic
  const filteredBranches = branches.filter((b) => {
    const matchSearch =
      !filters.search ||
      b.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      b.place?.toLowerCase().includes(filters.search.toLowerCase()) ||
      b.address?.toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus =
      !filters.status || b.status?.toLowerCase() === filters.status.toLowerCase();
    return matchSearch && matchStatus;
  });

  const paginatedBranches = filteredBranches.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(filteredBranches.length / rowsPerPage);

  useEffect(() => {
        if (!adminToken) {
          navigate("/admin-login");
        }
      }, [adminToken, navigate]);

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" /> All Branches
        </h2>
        <button
          onClick={() => navigate("/admin/add-branch")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          <PlusCircle className="w-4 h-4" /> Add New Branch
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 border rounded-lg">
        <div className="flex items-center bg-white border rounded-md px-3 py-1 w-64">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search by name, city or address..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full outline-none text-sm"
          />
        </div>

        <select
          className="border rounded-md px-3 py-1 bg-white text-sm"
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button
          onClick={() => setFilters({ search: "", status: "" })}
          className="text-sm text-gray-600 hover:text-blue-600"
        >
          Reset
        </button>
      </div>

      {/* Table */}
<div className="overflow-x-auto border rounded-lg">
  <table className="min-w-full text-sm text-center">
    <thead className="bg-gray-100 text-gray-700">
      <tr>
        <th className="border p-2 text-center">Branch Code</th>
        <th className="border p-2 text-left">Name</th>
        <th className="border p-2 text-left">Location</th>
        <th className="border p-2 text-center">Contact</th>
        <th className="border p-2 text-center">Email</th>
        <th className="border p-2 text-center">Status</th>
        <th className="border p-2 text-center">Actions</th>
      </tr>
    </thead>
    <tbody>
      {paginatedBranches.length === 0 ? (
        <tr>
          <td colSpan={7} className="text-center text-gray-500 py-4">
            No branches found
          </td>
        </tr>
      ) : (
        paginatedBranches.map((b) => (
          <tr key={b._id} className="hover:bg-gray-50 border-b">
            <td className="p-2 text-gray-600 text-center">{b.branchCode}</td>
            <td className="p-2 font-medium text-left">{b.name}</td>
            <td className="p-2 flex items-center gap-1 justify-start">
              <MapPin className="w-4 h-4 text-gray-500" /> {b.place}
            </td>
            <td className="p-2 text-center">{b.contact}</td>
            <td className="p-2 text-center">{b.email}</td>
            <td className="p-2 text-center">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  b.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {b.status}
              </span>
            </td>
            <td className="p-2 flex justify-center gap-3">
              <button
                onClick={() => toggleStatus(b._id)}
                className="text-gray-600 hover:text-blue-600"
              >
                {b.status === "Active" ? (
                  <XCircle className="w-4 h-4" title="Deactivate" />
                ) : (
                  <CheckCircle className="w-4 h-4" title="Activate" />
                )}
              </button>

              <button
                onClick={() => navigate(`/admin/edit-branch/${b._id}`)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" title="Edit Branch" />
              </button>
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

export default AllBranch;

