import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LabContext } from "../../context/LabContext";
import axios from "axios";

export default function TestDatabase() {
  const { categories, adminToken, branchId, errorToast, branchToken, navigate, successToast } = useContext(LabContext);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleEdit = (test) => {
    switch (test.type) {
      case "single":
        navigate(`/admin/edit-test/single/${test._id}`);
        break;
      case "multi":
        navigate(`/admin/edit-test/multi/${test._id}`);
        break;
      case "nested":
        navigate(`/admin/edit-test/nested/${test._id}`);
        break;
      case "document":
        navigate(`/admin/edit-test/document/${test._id}`);
        break;
      default:
        console.error("Unknown test type:", test.type);
    }
  };

  // Fetch tests from backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        let url = "";

        if (adminToken) {
          url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/list`;
        } else if (branchToken) {
          url = `${import.meta.env.VITE_API_URL}/api/test/database/list`;
        } else {
          errorToast?.("Unauthorized! Cannot fetch tests.");
          setLoading(false);
          return;
        }

        const headers = adminToken
          ? { Authorization: `Bearer ${adminToken}` }
          : { Authorization: `Bearer ${branchToken}` };

        const res = await axios.get(url, { headers });




        if (res.data.success && res.data.tests) {
          setTests([...res.data.tests].reverse());

        } else {
          errorToast?.(res.data.message || "Failed to fetch tests");
        }
      } catch (err) {
        console.error("Error fetching tests:", err);
        errorToast?.("Error fetching tests");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [adminToken, branchId]);

  // Filtering logic
  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add this function inside the component
  const handleDelete = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/test/database/admin/delete/${testId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        successToast?.("Test deleted successfully!");
        // Remove the deleted test from state
        setTests((prev) => prev.filter((t) => t._id !== testId));
      } else {
        errorToast?.(res.data.message || "Failed to delete test");
      }
    } catch (err) {
      console.error("Error deleting test:", err);
      errorToast?.("Error deleting test");
    }
  };


  const addNewPath = adminToken ? "/admin/add-test-manually" : `/${branchId}/add-test-manually`;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold mb-2">Test database</h1>
        <Link
          to={addNewPath}
          className="px-3 py-1 rounded border bg-blue-600 border-blue-600 cursor-pointer hover:bg-blue-700 transition"
        >
          <p className="text-lg text-white whitespace-nowrap">+ Add new</p>
        </Link>
      </div>

      <p className="text-gray-600 mb-4">
        <strong>Important:</strong> Please verify and update reference ranges before using for reports.
      </p>

       {/* Category Filter Tabs */}
<div className="flex flex-wrap gap-2 mb-4">
  <button
    onClick={() => setSelectedCategory("All")}
    className={`px-4 py-1 rounded-full border transition ${
      selectedCategory === "All"
        ? "bg-blue-500 text-white border-blue-500"
        : "bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200"
    }`}
  >
    All
  </button>

  {categories.map((cat) => (
    <button
      key={cat._id}
      onClick={() => setSelectedCategory(cat.name)}
      className={`px-4 py-1 rounded-full border transition ${
        selectedCategory === cat.name
          ? "bg-blue-500 text-white border-blue-500"
          : "bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200"
      }`}
    >
      {cat.name}
    </button>
  ))}
</div>
      {/* Search */}
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Search in page"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-400 px-3 py-2 rounded w-64"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-400 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border border-gray-400 px-3 py-2 text-left w-20">ORDER</th>
              <th className="border border-gray-400 px-3 py-2 text-left">NAME</th>
              <th className="border border-gray-400 px-3 py-2 text-left">SHORT NAME</th>
              <th className="border border-gray-400 px-3 py-2 text-left">CATEGORY</th>
              <th className="border border-gray-400 px-3 py-2 text-center w-32">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Loading tests...
                </td>
              </tr>
            ) : filteredTests.length > 0 ? (
              filteredTests.map((test, index) => (
                <tr key={test._id} className="hover:bg-gray-50">
                  <td className="border border-gray-400 px-3 py-2">{index + 1}.</td>
                  <td className="border border-gray-400 px-3 py-2">{test.name}</td>
                  <td className="border border-gray-400 px-3 py-2">{test.shortName || "-"}</td>
                  <td className="border border-gray-400 px-3 py-2">{test.category}</td>
                  <td className="border border-gray-400 px-3 py-2 text-center">
                    <button onClick={() => handleEdit(test)} className="text-blue-500 hover:underline mr-2">Edit</button>
                    <button onClick={()=> navigate(`/admin/test-view/${test._id}`)}  className="text-blue-500 hover:underline mr-2">View</button>
                    {/* <button
                      onClick={() => navigate(`/admin/test-values/${test._id}`)}
                      className="text-green-600 hover:underline mr-2"
                    >
                      Edit Values
                    </button> */}

                    <button onClick={() => handleDelete(test._id)} className="text-gray-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No tests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
