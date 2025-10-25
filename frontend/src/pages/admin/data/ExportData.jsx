import React, { useState, useEffect, useContext } from "react";
import { Download, FileSpreadsheet, ChevronLeft, ChevronRight, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { LabContext } from "../../../context/LabContext";
import axios from "axios";

const ExportData = ({ selectedBranch }) => {
  const { adminToken, errorToast } = useContext(LabContext);

  const [branches, setBranches] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", fromDate: "", toDate: "" });
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Cache for test/panel/package details
  const [itemCache, setItemCache] = useState({}); // id -> {type, data}

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

  // -------------------- Extract safe ID --------------------
  const extractId = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    if (item._id) return item._id.toString();
    if (item.testId) return item.testId.toString();
    return null;
  };

  // -------------------- Fetch individual item --------------------
  const fetchItemDetails = async (id) => {
    const safeId = extractId(id);
    if (!safeId) return null;

    // Return from cache if exists
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

    // Save to cache
    if (result) setItemCache((prev) => ({ ...prev, [safeId]: result }));
    return result;
  };

  // -------------------- Fetch all items for a report --------------------
  const fetchTestsForReport = async (report) => {
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

        // Fetch tests/panels/packages for each report
        const reportsWithItems = await Promise.all(
          reports.map(async (r) => {
            const items = await fetchTestsForReport(r);
            return { ...r, items };
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

  // -------------------- Filtered Data --------------------
  const filteredData = data.filter((d) => {
    const matchBranch = !selectedBranch || d.branchId === selectedBranch;
    const matchSearch =
      !filters.search ||
      d.patient?.firstName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      d.patient?.lastName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      d.regNo.toLowerCase().includes(filters.search.toLowerCase()) ||
      d.items?.some((i) => i.data?.name.toLowerCase().includes(filters.search.toLowerCase()));
    const matchFromDate = !filters.fromDate || new Date(d.createdAt) >= new Date(filters.fromDate);
    const matchToDate = !filters.toDate || new Date(d.createdAt) <= new Date(filters.toDate);

    return matchBranch && matchSearch && matchFromDate && matchToDate;
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
      Branch: branches.find((b) => b.id === d.branchId)?.name || "N/A",
    }));

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(prepareExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Data");
    XLSX.writeFile(wb, "AllData.xlsx");
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(prepareExportData());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AllData.csv";
    link.click();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5" /> Export All Data
      </h2>

      {/* Filters */}
      <div className="grid md:grid-cols-5 grid-cols-2 gap-3 mb-4">
        <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="border p-2 rounded-md text-sm" />
        <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="border p-2 rounded-md text-sm" />
        <div className="flex items-center border rounded-md px-2 col-span-2">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input type="text" name="search" placeholder="Search patient / reg no / test" value={filters.search} onChange={handleFilterChange} className="outline-none flex-1 text-sm" />
        </div>

        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center bg-green-600 text-white px-3 py-1 rounded-md text-sm">
            <Download className="w-4 h-4 mr-1" /> Excel
          </button>
          <button onClick={exportToCSV} className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
            <Download className="w-4 h-4 mr-1" /> CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center py-6 text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Reg No</th>
                <th className="p-2 text-left">Patient</th>
                <th className="p-2 text-left">Test</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2 text-left">Paid</th>
                <th className="p-2 text-left">Discount</th>
                <th className="p-2 text-left">Branch</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((d, i) => {
                  const branch = branches.find((b) => b.id === d.branchId);
                  return (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="p-2">{d.regNo}</td>
                      <td className="p-2">{`${d.patient?.firstName || ""} ${d.patient?.lastName || ""}`}</td>
                      <td className="p-2">
                        {d.items?.map((t) => {
                          if (t.type === "TEST") return `${t.data.name} (${t.data.category})`;
                          if (t.type === "PANEL") return `Panel: ${t.data.name}`;
                          if (t.type === "PACKAGE") return `Package: ${t.data.name}`;
                          return "Unknown";
                        }).join("; ")}
                      </td>
                      <td className="p-2">Rs.{d.payment?.total || 0}</td>
                      <td className="p-2">Rs.{d.payment?.received || 0}</td>
                      <td className="p-2">Rs.{d.payment?.discount || 0}</td>
                      <td className="p-2">{branch?.name || "N/A"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-3 text-gray-500">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50">
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </button>
        <span>
          Page {page} of {Math.ceil(filteredData.length / rowsPerPage) || 1}
        </span>
        <button disabled={page === Math.ceil(filteredData.length / rowsPerPage)} onClick={() => setPage((p) => p + 1)} className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50">
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default ExportData;
