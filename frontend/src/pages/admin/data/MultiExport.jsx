import React, { useContext, useState, useEffect } from "react";
import { Download, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import { LabContext } from "../../../context/LabContext";
import axios from "axios";

const MultiExport = () => {
  const { adminToken, errorToast } = useContext(LabContext);

  const [branches, setBranches] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch: "",
    category: "",
    search: "",
    fromDate: "",
    toDate: "",
  });
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [itemCache, setItemCache] = useState({}); // cache for test/panel/package details

  // -------------------- Fetch branches --------------------
  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/branch/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setBranches(res.data.branches || []);
    } catch (err) {
      console.error(err);
      errorToast("Failed to load branches", "error");
    }
  };

  // -------------------- Extract ID safely --------------------
  const extractId = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    if (item._id) return item._id.toString();
    if (item.testId) return item.testId.toString();
    return null;
  };

  // -------------------- Fetch individual TEST/PANEL/PACKAGE --------------------
  const fetchItemDetails = async (id) => {
    const safeId = extractId(id);
    if (!safeId) return null;

    if (itemCache[safeId]) return itemCache[safeId];

    let result = null;
    try {
      const testRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${safeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (testRes.data.success && testRes.data.data) {
        result = { type: "TEST", data: { name: testRes.data.data.name, category: testRes.data.data.categoryName || "Other" } };
      }
    } catch {}

    if (!result) {
      try {
        const panelRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${safeId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (panelRes.data.success && panelRes.data.data) result = { type: "PANEL", data: panelRes.data.data };
      } catch {}
    }

    if (!result) {
      try {
        const packageRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/test/packages/admin/package/${safeId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (packageRes.data.success && packageRes.data.data) result = { type: "PACKAGE", data: packageRes.data.data };
      } catch {}
    }

    if (result) setItemCache((prev) => ({ ...prev, [safeId]: result }));
    return result;
  };

  // -------------------- Fetch all items for a report --------------------
  const fetchItemsForReport = async (report) => {
    const allIds = [
      ...(report.tests?.LAB || []),
      ...(report.tests?.PANELS || []),
      ...(report.tests?.PACKAGES || []),
    ];
    const items = await Promise.all(allIds.map(fetchItemDetails));
    return items.filter(Boolean);
  };

  // -------------------- Fetch all reports --------------------
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/cases/admin/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data.success) {
        const reports = res.data.data || [];
        const reportsWithItems = await Promise.all(
          reports.map(async (r) => {
            const items = await fetchItemsForReport(r);
            return { ...r, items, branchId: r.branchId?.toString() }; // ensure branchId is string
          })
        );
        setData(reportsWithItems);
      } else {
        errorToast(res.data.message || "Failed to fetch reports");
      }
    } catch (err) {
      console.error(err);
      errorToast("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchBranches();
      fetchReports();
    }
  }, [adminToken]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // -------------------- Filter data --------------------
  const filteredData = data.filter((d) => {
    const matchBranch = !filters.branch || d.branchId === filters.branch; // string comparison
    const matchCategory =
      !filters.category || d.items?.some((i) => i.data.category === filters.category);
    const matchSearch =
      !filters.search ||
      d.patient?.firstName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      d.patient?.lastName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      d.regNo?.toLowerCase().includes(filters.search.toLowerCase()) ||
      d.items?.some((i) => i.data.name.toLowerCase().includes(filters.search.toLowerCase()));
    const matchFrom = !filters.fromDate || new Date(d.createdAt) >= new Date(filters.fromDate);
    const matchTo = !filters.toDate || new Date(d.createdAt) <= new Date(filters.toDate);

    return matchBranch && matchCategory && matchSearch && matchFrom && matchTo;
  });

  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // -------------------- Export --------------------
  const prepareExportData = () =>
    filteredData.map((d) => ({
      Date: new Date(d.createdAt).toLocaleDateString(),
      "Reg No": d.regNo,
      Patient: `${d.patient?.firstName || ""} ${d.patient?.lastName || ""}`,
      Test: d.items?.map((t) => {
        if (t.type === "TEST") return `${t.data.name} (${t.data.category})`;
        if (t.type === "PANEL") return `Panel: ${t.data.name}`;
        if (t.type === "PACKAGE") return `Package: ${t.data.name}`;
        return "Unknown";
      }).join("; ") || "",
      Amount: d.payment?.total || 0,
      Paid: d.payment?.received || 0,
      Discount: d.payment?.discount || 0,
      Branch: branches.find((b) => b._id === d.branchId)?.name || "N/A",
    }));

  const exportToExcel = () => {
    const branchName = filters.branch
      ? branches.find((b) => b._id === filters.branch)?.name
      : "All_Branches";

    const ws = XLSX.utils.json_to_sheet(prepareExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ExportData");
    XLSX.writeFile(wb, `Export_${branchName}_${Date.now()}.xlsx`);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-green-600" /> Export All Branch Data
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <select name="branch" value={filters.branch} onChange={handleFilterChange} className="border p-2 rounded-md">
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>

        <select name="category" value={filters.category} onChange={handleFilterChange} className="border p-2 rounded-md">
          <option value="">All Categories</option>
          <option>Biochemistry</option>
          <option>Hematology</option>
          <option>Pathology</option>
          <option>Endocrinology</option>
          <option>Immunology</option>
        </select>

        <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="border p-2 rounded-md" />
        <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="border p-2 rounded-md" />

        <div className="flex items-center border rounded-md p-2">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search test/patient..." className="outline-none flex-1" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Branch</th>
              <th className="p-2 border">Reg No</th>
              <th className="p-2 border">Patient</th>
              <th className="p-2 border">Tests/Panels/Packages</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Paid</th>
              <th className="p-2 border">Discount</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((d, i) => {
                const branch = branches.find((b) => b._id === d.branchId);
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2 border">{branch?.name || "-"}</td>
                    <td className="p-2 border">{d.regNo}</td>
                    <td className="p-2 border">{`${d.patient?.firstName || ""} ${d.patient?.lastName || ""}`}</td>
                    <td className="p-2 border">{d.items?.map((t) => t.type === "TEST" ? `${t.data.name} (${t.data.category})` : t.type === "PANEL" ? `Panel: ${t.data.name}` : `Package: ${t.data.name}`).join("; ")}</td>
                    <td className="p-2 border text-right">Rs.{d.payment?.total || 0}</td>
                    <td className="p-2 border text-right">Rs.{d.payment?.received || 0}</td>
                    <td className="p-2 border text-right">Rs.{d.payment?.discount || 0}</td>
                    <td className="p-2 border">{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center p-3 text-gray-500">No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="flex items-center border px-3 py-1 rounded-md disabled:opacity-50">
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </button>
        <span>Page {page} of {Math.ceil(filteredData.length / rowsPerPage) || 1}</span>
        <button disabled={page === Math.ceil(filteredData.length / rowsPerPage)} onClick={() => setPage((p) => p + 1)} className="flex items-center border px-3 py-1 rounded-md disabled:opacity-50">
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Export Button */}
      <div className="flex justify-end mt-6">
        <button onClick={exportToExcel} disabled={filteredData.length === 0} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
          <Download className="w-4 h-4 mr-2" /> Export to Excel
        </button>
      </div>
    </div>
  );
};

export default MultiExport;
