import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LabContext } from "../../context/LabContext";
import axios from "axios";
import Loader from "../../components/Loader";

export default function TestPackages() {
  const { adminToken, branchId, branchToken, errorToast, successToast } =
    useContext(LabContext);
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("in");
  const [openMenuId, setOpenMenuId] = useState(null);

  // Fetch packages from backend
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const url = adminToken
          ? `${import.meta.env.VITE_API_URL}/api/test/packages/admin/list`
          : `${import.meta.env.VITE_API_URL}/api/test/packages/list`;

        const token = adminToken || branchToken;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setPackages(res.data.packages.reverse() || []);
        } else {
          errorToast("Failed to fetch packages.");
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
        errorToast(err.response?.data?.message || "Failed to fetch packages.");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [adminToken, branchToken]);

  // Filter packages by search + tab
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === "in" ? pkg.inRatelist : !pkg.inRatelist;
    return matchesSearch && matchesTab;
  });

  // Toggle ratelist status (admin only)
  const toggleRatelist = async (id) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/test/packages/admin/toggle-ratelist/${id}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        setPackages((prev) =>
          prev.map((p) =>
            p._id === id ? { ...p, inRatelist: res.data.package.inRatelist } : p
          )
        );
        successToast(res.data.message);
      } else {
        errorToast("Failed to update ratelist status");
      }
    } catch (err) {
      console.error(err);
      errorToast("Failed to update ratelist status");
    } finally {
      setOpenMenuId(null);
    }
  };

  // Navigate to edit page (admin only)
  const handleEdit = (id) => {
    navigate(`/admin/edit-package/${id}`);
  };

  // Delete package (admin only)
  const deletePackage = async (id) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/test/packages/admin/delete/${id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        setPackages((prev) => prev.filter((p) => p._id !== id));
        successToast("Package deleted successfully");
      } else {
        errorToast("Failed to delete package");
      }
    } catch (err) {
      console.error(err);
      errorToast("Failed to delete package");
    } finally {
      setOpenMenuId(null);
    }
  };

  if (loading) return <Loader />;

  const addNewPath = adminToken
    ? "/admin/add-package"
    : `/${branchId}/add-package`;

  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">Test Packages</h1>

      {/* Tabs */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <button
            className={`mr-2 px-4 py-2 rounded ${
              tab === "in" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setTab("in")}
          >
            In ratelist ({packages.filter((p) => p.inRatelist).length})
          </button>
          <button
            className={`px-4 py-2 rounded ${
              tab === "not" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setTab("not")}
          >
            Not in ratelist ({packages.filter((p) => !p.inRatelist).length})
          </button>
        </div>
        <Link
          to={addNewPath}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add new
        </Link>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search in page"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-4 w-full max-w-sm rounded"
      />

      {/* Table */}
      <table className="min-w-full border-collapse border border-gray-300 relative">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">S. NO.</th>
            <th className="border px-4 py-2">NAME</th>
            <th className="border px-4 py-2">FEE</th>
            <th className="border px-4 py-2">FOR GENDER</th>
            <th className="border px-4 py-2">INCLUDED TESTS AND PANELS</th>
            {adminToken && <th className="border px-4 py-2">ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {filteredPackages.map((pkg, idx) => (
            <tr key={pkg._id} className="hover:bg-gray-50 relative">
              <td className="border px-4 py-2">{idx + 1}.</td>
              <td className="border px-4 py-2">{pkg.name}</td>
              <td className="border px-4 py-2">Rs.{pkg.fee}</td>
              <td className="border px-4 py-2">{pkg.gender}</td>
              <td className="border px-4 py-2">
                {(pkg.tests || []).map((t) => t.name).join(", ")}
                {(pkg.panels || []).map((p) => p.name).join(", ")}
              </td>
              {adminToken && (
                <td className="border px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-blue-600 cursor-pointer"
                      onClick={() => handleEdit(pkg._id)}
                    >
                      Edit
                    </span>
                    <span
                      className="cursor-pointer px-2"
                      onClick={() =>
                        setOpenMenuId(openMenuId === pkg._id ? null : pkg._id)
                      }
                    >
                      ⋮
                    </span>

                    {openMenuId === pkg._id && (
                      <div className="absolute right-4 mt-8 w-48 bg-white border rounded shadow-lg z-10">
                        <button
                          onClick={() => toggleRatelist(pkg._id)}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                        >
                          {pkg.inRatelist
                            ? "Remove from ratelist"
                            : "Add to ratelist"}
                        </button>
                        <button
                          onClick={() => deletePackage(pkg._id)}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {filteredPackages.length === 0 && (
            <tr>
              <td
                colSpan={adminToken ? "6" : "5"}
                className="text-center p-4 text-gray-500"
              >
                No packages found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
