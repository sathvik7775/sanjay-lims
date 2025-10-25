import React, { useState, useEffect, useContext } from "react";
import { LabContext } from "../../context/LabContext";
import axios from "axios";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";

const Signature = () => {
  const { adminToken, branchToken, errorToast, successToast, branchId } = useContext(LabContext);
  const [signatures, setSignatures] = useState([]);
  const [loading, setloading] = useState(false)

  // Fetch signatures
  const fetchSignatures = async () => {
    try {
      let res;

      setloading(true)

      if (adminToken) {
        // Admin: fetch all signatures
        res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/report/signature/admin/list`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        setSignatures(res.data?.signatures || []);
        console.log("Admin signatures:", res.data);
      } else if (branchToken && branchId) {
        // Branch: fetch only its signatures
        res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/report/signature/branch/${branchId}`,
          { headers: { Authorization: `Bearer ${branchToken}` } }
        );
       setSignatures(res.data?.data || []);

        
      } else {
        setloading(false)
        console.warn("⚠️ No valid session found: neither branch nor admin detected.");
        setSignatures([]);
      }
    } catch (err) {
      setloading(false)
      console.error("❌ Error fetching signatures:", err);
      errorToast("Failed to fetch signatures");
    } finally{
      setloading(false)
    }
  };

  useEffect(() => {
    fetchSignatures();
  }, []);

  // Delete signature (admin only)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this signature?")) return;

    try {
      setloading(true)
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/report/signature/admin/delete/${id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success) {
        successToast("Signature deleted successfully");
        fetchSignatures();
      }
    } catch (err) {
      setloading(false)
      console.error(err);
      errorToast("Failed to delete signature");
    } finally{
      setloading(false)
    }
  };

  if (loading) return <Loader/>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {adminToken ? "All Signatures" : "Your Signatures"}
        </h2>
        {adminToken && (
          <Link
            to="/admin/add-signature"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add new
          </Link>
        )}
      </div>

      {signatures.length === 0 ? (
        <p className="text-center text-gray-500">No signatures found.</p>
      ) : (
        <div className="space-y-8">
          {signatures.map((sig) => (
            <div key={sig._id} className="border rounded p-4 bg-gray-50 relative">
              {/* Branch Name */}

              {adminToken && (
                  <h3 className="text-lg font-semibold mb-2">
                Branch: {sig.branchId?.name || "Unnamed Branch"}
              </h3>
              )}
              

              {/* Name & Designation */}
              <p className="text-gray-700 mb-1">
                <strong>{sig.name}</strong> — {sig.designation}
              </p>

              {/* Delete Button (admin only) */}
              {adminToken && (
                <button
                  onClick={() => handleDelete(sig._id)}
                  className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}

              {/* Signature Image */}
              {sig.imageUrl && (
                <img
                  src={sig.imageUrl}
                  alt={sig.name}
                  className="w-40 h-20 object-contain border mt-2"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Signature;
