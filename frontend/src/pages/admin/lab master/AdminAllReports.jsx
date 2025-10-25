import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";

const AdminAllReports = () => {
  const { branchId, adminToken, navigate, errorToast } = useContext(LabContext);

  const [allReports, setAllReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const [testDetailsMap, setTestDetailsMap] = useState({}); // reportId => array of tests/panels/packages

  const [filters, setFilters] = useState({
    duration: "Past 7 days",
    from: "",
    to: "",
    patient: "",
    status: "",
    referredBy: "",
    regNo: "",
    dailyCase: "",
    uhid: "",
    test: "",
  });

  // ---------------- Safely extract ID ----------------
  const extractId = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    if (item._id) return item._id.toString();
    if (item.testId) return item.testId.toString();
    return null;
  };

  // ---------------- Fetch individual item (TEST / PANEL / PACKAGE) ----------------
  const fetchItemDetails = async (id) => {
    const safeId = extractId(id);
    if (!safeId) return null;

    try {
      // TEST
      const testRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (testRes.data.success && testRes.data.data)
        return { type: "TEST", data: { name: testRes.data.data.name, category: testRes.data.data.categoryName || "Other" } };
    } catch {}

    try {
      // PANEL
      const panelRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (panelRes.data.success && panelRes.data.data) return { type: "PANEL", data: panelRes.data.data };
    } catch {}

    try {
      // PACKAGE
      const packageRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/packages/admin/package/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (packageRes.data.success && packageRes.data.data) return { type: "PACKAGE", data: packageRes.data.data };
    } catch {}

    return null;
  };

  // ---------------- Fetch all items for a report ----------------
  const fetchTestsForReport = async (report) => {
    const allIds = [
      ...(report.tests?.LAB || []),
      ...(report.tests?.PANELS || []),
      ...(report.tests?.PACKAGES || []),
    ];

    const items = await Promise.all(allIds.map(fetchItemDetails));
    setTestDetailsMap((prev) => ({ ...prev, [report._id]: items.filter(Boolean) }));
  };

  // ---------------- Fetch all reports and dynamic status ----------------
  const fetchReports = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${adminToken}` } };
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cases/admin/list`,
        config
      );

      if (res.data.success) {
        const reports = res.data.data || [];

        // Determine dynamic status
        const reportsWithStatus = await Promise.all(
          reports.map(async (r) => {
            try {
              const caseRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/results/admin/report/${r._id}`,
                config
              );

              const today = new Date();
              const createdAt = new Date(r.createdAt);
              const diffInDays = (today - createdAt) / (1000 * 60 * 60 * 24);

              let dynamicStatus = "In progress";
              if (caseRes.data.success && caseRes.data.data) dynamicStatus = "Signed off";
              else if (diffInDays < 1) dynamicStatus = "New";

              return { ...r, dynamicStatus };
            } catch {
              return { ...r, dynamicStatus: "In progress" };
            }
          })
        );

        setAllReports(reportsWithStatus);
        setFilteredReports(reportsWithStatus);

        // Fetch tests/panels/packages for each report
        reportsWithStatus.forEach(fetchTestsForReport);
      } else {
        errorToast(res.data.message || "Failed to fetch reports");
      }
    } catch (err) {
      console.error("Fetch Reports Error:", err);
      errorToast(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) fetchReports();
  }, [adminToken]);

  // ---------------- Filters ----------------
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFilters({
      duration: "Past 7 days",
      from: "",
      to: "",
      patient: "",
      status: "",
      referredBy: "",
      regNo: "",
      dailyCase: "",
      uhid: "",
      test: "",
    });
    setFilteredReports(allReports);
    setPage(1);
  };

  const handleSearch = () => {
    let results = [...allReports];

    if (filters.patient) results = results.filter(r => r.patient.firstName.toLowerCase().includes(filters.patient.toLowerCase()));
    if (filters.status) results = results.filter(r => r.dynamicStatus === filters.status);
    if (filters.referredBy) results = results.filter(r => r.referredBy === filters.referredBy);
    if (filters.regNo) results = results.filter(r => r.regNo.includes(filters.regNo));
    if (filters.dailyCase) results = results.filter(r => r.dailyCase.includes(filters.dailyCase));
    if (filters.uhid) results = results.filter(r => r.uhid?.toLowerCase().includes(filters.uhid.toLowerCase()));
    if (filters.test) {
      results = results.filter((r) =>
        testDetailsMap[r._id]?.some(
          (t) =>
            (t.type === "TEST" && t.data.name === filters.test) ||
            (t.type === "PANEL" && t.data.name === filters.test) ||
            (t.type === "PACKAGE" && t.data.name === filters.test)
        )
      );
    }
    if (filters.from) results = results.filter(r => new Date(r.date) >= new Date(filters.from));
    if (filters.to) results = results.filter(r => new Date(r.date) <= new Date(filters.to));

    setFilteredReports(results);
    setPage(1);
  };

  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const paginatedReports = filteredReports.slice((page - 1) * pageSize, page * pageSize);

  const getStatusStyle = (status) => {
  const safeStatus = status || "Loading"; // default if status is undefined
  switch (safeStatus) {
    case "Signed off":
      return "bg-green-100 text-green-700 border border-green-400 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap";
    case "New":
      return "bg-blue-100 text-blue-700 border border-blue-400 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap";
    case "In progress":
      return "bg-red-100 text-red-700 border border-red-400 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap";
    case "Loading":
      return "bg-gray-100 text-gray-500 border border-gray-300 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap";
    default:
      return "px-2 py-1 text-xs whitespace-nowrap";
  }
};


  if (loading) return <Loader />;

  return (
    <div className="p-6 bg-gray-50 min-h-screen ">
      <h1 className="text-2xl font-bold mb-6">Search Lab Reports</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input type="text" name="patient" placeholder="Patient first name" value={filters.patient} onChange={handleFilterChange} className="border px-3 py-2 rounded-md text-sm" />
        <input type="text" name="regNo" placeholder="Reg no" value={filters.regNo} onChange={handleFilterChange} className="border px-3 py-2 rounded-md text-sm" />
        <input type="text" name="dailyCase" placeholder="Daily case" value={filters.dailyCase} onChange={handleFilterChange} className="border px-3 py-2 rounded-md text-sm" />
        <input type="text" name="uhid" placeholder="UHID" value={filters.uhid} onChange={handleFilterChange} className="border px-3 py-2 rounded-md text-sm" />

        <select name="status" value={filters.status} onChange={handleFilterChange} className="border px-3 py-2 rounded-md text-sm">
          <option value="">Status</option>
          <option>New</option>
          <option>In progress</option>
          <option>Signed off</option>
        </select>

        <select name="referredBy" value={filters.referredBy} onChange={handleFilterChange} className="border px-3 py-2 rounded-md text-sm">
          <option value="">Select referrer</option>
          <option>CALLMEDLIFE</option>
          <option>MEDIBUDDY TPA</option>
          <option>GOWNEXT TPA</option>
          <option>HEALTHINDIA TPA</option>
        </select>

        <input type="text" name="test" placeholder="Search test/panel/package" value={filters.test} onChange={handleFilterChange} className="border px-3 py-2 rounded-md text-sm col-span-2" />

        <div className="flex gap-2 col-span-2">
          <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Search</button>
          <button onClick={handleClear} className="bg-gray-200 px-4 py-2 rounded-md text-sm">Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">PAT. ID</th>
              <th className="p-3 text-left">DATE/TIME</th>
              <th className="p-3 text-left">PATIENT</th>
              <th className="p-3 text-left">REFERRED BY</th>
              <th className="p-3 text-left">TESTS/PANELS/PACKAGES</th>
              <th className="p-3 text-left">STATUS</th>
              <th className="p-3 text-left">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">No results found</td>
              </tr>
            ) : (
              paginatedReports.map((r) => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{r.regNo}</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleDateString("en-GB")}<br />{new Date(r.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}</td>
                  <td className="p-3">{r.patient.firstName} {r.patient.lastName}</td>
                  <td className="p-3">{r.patient.doctor}</td>
                  <td className="p-3">
                    {testDetailsMap[r._id]?.map((t) => {
                      if (t.type === "TEST") return `${t.data.name} (${t.data.category})`;
                      if (t.type === "PANEL") return `Panel: ${t.data.name}`;
                      if (t.type === "PACKAGE") return `Package: ${t.data.name}`;
                      return "Unknown";
                    }).join(", ") || "Loading..."}
                  </td>
                  <td className="p-3">
                    <span className={getStatusStyle(r.dynamicStatus)}>{r.dynamicStatus}</span>
                  </td>
                  <td className="p-3 flex flex-col gap-1">
                    <button onClick={() => navigate(`/${branchId}/bill/${r._id}`)} className="text-blue-600 text-sm cursor-pointer">View bill</button>
                    <button onClick={() => navigate(`/admin/enter-result/${r._id}`)} className="text-gray-600 text-sm cursor-pointer">Enter results</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 gap-3">
        <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">Prev</button>
        <span className="text-sm">Page {page} of {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default AdminAllReports;
