
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const EditCategory = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const { id } = useParams(); // ✅ categoryId from URL
  const navigate = useNavigate();
  const { adminToken, successToast, errorToast } = useContext(LabContext);

  // ✅ Fetch category details on mount
  useEffect(() => {
    const fetchCategory = async () => {
      if (!adminToken) {
        errorToast?.("Unauthorized! Please log in as admin.");
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/test/category/admin/list`,
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);


        if (res.data.success) {
          const category = res.data.categories.find((cat) => cat._id === id);
          if (category) setName(category.name);
          else errorToast?.("Category not found");
        }
      } catch (err) {
        console.error("Error fetching category:", err);
        errorToast?.("Failed to load category details");
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [id, adminToken, errorToast]);

  // ✅ Handle update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      errorToast?.("Please enter a category name");
      return;
    }

    if (!adminToken) {
      errorToast?.("Unauthorized! Only admin can edit categories.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/test/category/admin/edit/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        successToast?.("Category updated successfully!");
        navigate(-1); // Go back to previous page
      } else {
        errorToast?.(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Error updating category:", err);
      errorToast?.("Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (!adminToken) {
    return (
      <div className="text-center mt-10 text-red-600">
        You are not authorized to edit categories.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Edit Category</h1>
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
          {loading ? "Saving..." : "Update"}
        </button>
      </form>
    </div>
  );
};

export default EditCategory;
