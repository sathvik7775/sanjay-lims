import React, { useState, useEffect, useContext } from "react";
import { Trash2, Building2, AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";

const DeleteBranch = () => {
  const navigate = useNavigate();
  const { adminToken, successToast, errorToast } = useContext(LabContext);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🟩 Fetch all branches from backend
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/branch/list`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );
       
        setBranches(res.data.branches);

      } catch (error) {
        console.error("Error fetching branches:", error);
        errorToast("Failed to load branches!");
      } finally {
        setLoading(false);
      }
    };

    if (adminToken) fetchBranches();
  }, [adminToken, errorToast]);

  // 🟥 Handle delete branch
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/branch/delete/${id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      setBranches((prev) => prev.filter((b) => b._id !== id));
      setSelectedBranch(null);
      successToast("✅ Branch deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      errorToast("❌ Failed to delete branch!");
    }
  };

  useEffect(() => {
        if (!adminToken) {
          navigate("/admin-login");
        }
      }, [adminToken, navigate]);

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-red-600" />
          Delete Branch
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-blue-600"
        >
          ← Back
        </button>
      </div>

      {/* Branch Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Branch ID</th>
              <th className="px-4 py-2 text-left">Branch Name</th>
              <th className="px-4 py-2 text-left">Place</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {branches.length > 0 ? (
              branches.map((branch) => (
                <tr
                  key={branch._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2 font-medium">{branch._id}</td>
                  <td className="px-4 py-2">{branch.name}</td>
                  <td className="px-4 py-2">{branch.place}</td>
                  <td className="px-4 py-2">{branch.address}</td>
                  <td
                    className={`px-4 py-2 font-medium ${
                      branch.status === "Active"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {branch.status}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => setSelectedBranch(branch)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 mx-auto"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-4">
                  No branches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {selectedBranch && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <button
              onClick={() => setSelectedBranch(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Confirm Deletion
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Are you sure you want to delete{" "}
                <span className="font-medium">{selectedBranch.name}</span>? This
                action cannot be undone.
              </p>

              <div className="flex justify-center gap-3 mt-2">
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(selectedBranch._id)}
                  className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteBranch;
