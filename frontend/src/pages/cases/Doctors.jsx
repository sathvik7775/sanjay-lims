import React, { useContext, useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";
import { useLocation } from "react-router-dom";


export default function Doctors() {
  const { adminToken, branchToken, errorToast, successToast } = useContext(LabContext);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: "", phone: "", specialization: "" });

  const location = useLocation();

  // ✅ Fetch all doctors
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = adminToken || branchToken;
      const endpoint = adminToken
      
        ? `${import.meta.env.VITE_API_URL}/api/doctors/admin/list`
        : `${import.meta.env.VITE_API_URL}/api/doctors/branch/list`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setDoctors(res.data.data.reverse() || []);
        
        
      } else {
        errorToast(res.data.message || "Failed to fetch doctors");
      }
    } catch (err) {
      console.error(err);
      errorToast("Error fetching doctors");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add new doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newDoctor.name.trim()) return errorToast("Doctor name is required");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/doctors/add`,
        newDoctor,
        
      );

      if (res.data.success) {
        successToast("Doctor added successfully");
        setShowModal(false);
        setNewDoctor({ name: "", phone: "", specialization: "" });
        fetchDoctors();
      } else {
        errorToast(res.data.message || "Failed to add doctor");
      }
    } catch (err) {
      console.error(err);
      errorToast("Error adding doctor");
    }
  };

  // ✅ Delete doctor
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/doctors/delete/${id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      if (res.data.success) {
        successToast("Doctor deleted successfully");
        setDoctors(doctors.filter((d) => d._id !== id));
      } else {
        errorToast(res.data.message);
      }
    } catch (err) {
      console.error(err);
      errorToast("Failed to delete doctor");
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  

// ✅ Open modal automatically if navigated with openModal flag
useEffect(() => {
  if (location.state?.openModal) {
    setShowModal(true);
  }
}, [location.state]);


  if (loading) return <Loader/>

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Referral Doctors</h1>

        {/* ✅ Add button (Admin only) */}
        
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
       
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <p className="p-6 text-gray-500 text-center">Loading...</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100 text-sm text-gray-700">
              <tr>
                <th className="py-3 px-4 border-b text-left font-medium">#</th>
                <th className="py-3 px-4 border-b text-left font-medium">Registered On</th>
                <th className="py-3 px-4 border-b text-left font-medium">Name</th>
                <th className="py-3 px-4 border-b text-left font-medium">Phone</th>
                <th className="py-3 px-4 border-b text-left font-medium">Specialization</th>
                {adminToken && (
                  <th className="py-3 px-4 border-b text-left font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {doctors.length > 0 ? (
                doctors.map((doc, i) => (
                  <tr key={doc._id} className="hover:bg-gray-50 text-sm transition">
                    <td className="py-3 px-4 border-b">{i + 1}</td>
                    <td className="py-3 px-4 border-b">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 border-b font-medium">{doc.name}</td>
                    <td className="py-3 px-4 border-b">{doc.phone || "—"}</td>
                    <td className="py-3 px-4 border-b">{doc.specialization || "—"}</td>
                    {adminToken && (
                      <td className="py-3 px-4 border-b">
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={!adminToken ? 5 : 6}
                    className="text-center py-6 text-gray-500"
                  >
                    No doctors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Add Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90%] max-w-md p-6 relative shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold mb-4">Add New Doctor</h2>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newDoctor.name}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, name: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter doctor's name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={newDoctor.phone}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, phone: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={newDoctor.specialization}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, specialization: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter specialization"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
