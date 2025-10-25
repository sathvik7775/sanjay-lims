import React, { useState, useContext } from "react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";



export default function NewCategory() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  


  const { adminToken, branchToken, branchId, successToast, errorToast } = useContext(LabContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      errorToast?.("Please enter a category name");
      return;
    }

    if (!adminToken && !branchToken) {
      errorToast?.("Unauthorized! Please log in.");
      return;
    }

    try {
      setLoading(true);

      let url = "";
      let headers = {};
      const payload = { name };

      if (adminToken) {
        url = `${import.meta.env.VITE_API_URL}/api/test/category/admin/add`;
        headers = { Authorization: `Bearer ${adminToken}` };
      } else if (branchToken) {
        if (!branchId) {
          errorToast?.("Branch ID missing! Cannot create request.");
          setLoading(false);
          return;
        }
        url = `${import.meta.env.VITE_API_URL}/api/test/category/add`;
        headers = { Authorization: `Bearer ${branchToken}` };
        payload.branchId = branchId; // Required for branch requests
      }

      const res = await axios.post(url, payload, { headers });

      if (res.data.success) {
        successToast?.(
          adminToken ? "Category added globally!" : "Category request sent for approval!"
        );
        setName("");
      } else {
        errorToast?.(res.data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Error adding category:", err);
      errorToast?.("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  // Show message if no token (optional)
  if (!adminToken && !branchToken) {
    return (
      <div className="text-center mt-10 text-red-600">
        You are not authorized to create categories.
      </div>
    );
  }

  


  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">New Category</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="categoryName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            * Name
          </label>
          <input
            type="text"
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white px-5 py-2 rounded-md transition`}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
