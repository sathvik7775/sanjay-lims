import React, { useState, useEffect, useContext } from "react";
import { LabContext } from "../../context/LabContext";
import axios from "axios";
import LetterheadPreview from "../../components/LetterheadPreview";
import { Link } from "react-router-dom";

const Letterhead = () => {
  const { adminToken, branchToken, errorToast, successToast, branchId } = useContext(LabContext);
  const [letterheads, setLetterheads] = useState([]);

  console.log(branchId);
  
  

  // Fetch letterheads
  const fetchLetterheads = async () => {
  try {
    let res;

    if (adminToken) {
      // Admin: fetch all letterheads
      res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/report/letterhead/admin/list`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setLetterheads(res.data?.letterheads || []);
      console.log("Admin letterheads:", res.data);
    } else if (branchToken && branchId) {
      // Branch user: fetch only its letterhead
      res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/report/letterhead/branch/${branchId}`,
        { headers: { Authorization: `Bearer ${branchToken}` } }
      );
      setLetterheads(res.data?.data ? [res.data.data] : []);
      console.log("Branch letterhead:", res.data);
    } else {
      console.warn("⚠️ No valid session found: neither branch nor admin detected.");
      setLetterheads([]);
    }

  } catch (err) {
    console.error("❌ Error fetching letterheads:", err);
    errorToast("Failed to fetch letterheads");
  }
};


  useEffect(() => {
    fetchLetterheads();
  }, []);

  // Delete letterhead (only admin can delete)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this letterhead?")) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/report/letterhead/admin/delete/${id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success) {
        successToast("Letterhead deleted successfully");
        fetchLetterheads();
      }
    } catch (err) {
      console.error(err);
      errorToast("Failed to delete letterhead");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {adminToken ? "All Letterheads" : "Your Letterheads"}
        </h2>
        {adminToken && (
          <Link
            to="/admin/add-letter"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add new
          </Link>
        )}
      </div>

      {letterheads.length === 0 ? (
        <p className="text-center text-gray-500">No letterheads found.</p>
      ) : (
        <div className="space-y-8">
          {letterheads.map((lh) => (
            <div key={lh._id} className="border rounded p-4 bg-gray-50 relative">
              {/* Branch Name */}
              <h3 className="text-lg font-semibold mb-2">
                Branch: {lh.name || "Unnamed Branch"} LABORATORY
              </h3>

              {/* Delete Button (admin only) */}
              {!branchToken && (
                <button
                  onClick={() => handleDelete(lh._id)}
                  className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}

              {/* Letterhead Preview */}
              <LetterheadPreview lh={lh} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Letterhead;
