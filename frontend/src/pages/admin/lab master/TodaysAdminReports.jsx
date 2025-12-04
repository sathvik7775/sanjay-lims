import React, { useState, useEffect, useContext } from "react";

import axios from "axios";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";


const TodaysAdminreports = () => {
  const { selectedBranch,  navigate, errorToast, adminToken } = useContext(LabContext);

  const [allReports, setAllReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [todaysReports, setTodaysReports] = useState([]);
  const [branchId, setBranchId] = useState(null)

 useEffect(() => {
  setBranchId(selectedBranch);
}, [selectedBranch]);


  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("All");


  const pageSize = 20;

  const [testDetailsMap, setTestDetailsMap] = useState({}); // reportId => tests/panels/packages

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

  // ---------------- Fetch test, panel, or package ----------------
  const fetchItemDetails = async (id) => {
    const safeId = extractId(id);
    if (!safeId) return null;

    // 1️⃣ Try as TEST
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success && res.data.data) {
        return { type: "TEST", data: { name: res.data.data.name, category: res.data.data.categoryName } };
      }
    } catch { }

    // 2️⃣ Try as PANEL
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success && res.data.data) {
        return { type: "PANEL", data: res.data.data };
      }
    } catch { }

    // 3️⃣ Try as PACKAGE
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/packages/admin/package/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success && res.data.data) {
        return { type: "PACKAGE", data: res.data.data };
      }
    } catch { }

    return null;
  };

  // ---------------- Fetch tests for a report ----------------
  const fetchTestsForReport = async (report) => {
    try {
      const allIds = [
        ...(report.tests?.LAB || []),
        ...(report.tests?.PANELS || []),
        ...(report.tests?.PACKAGES || []),
      ];

      const items = await Promise.all(allIds.map(fetchItemDetails));
      setTestDetailsMap((prev) => ({ ...prev, [report._id]: items.filter(Boolean) }));
    } catch (err) {
      console.error("Fetch Test/Panel/Package Error:", err);
    }
  };

  // ---------------- Fetch reports and determine dynamic status ----------------
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

        // Determine status dynamically for each report
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
              if (caseRes.data.success && caseRes.data.data) {
                dynamicStatus = "Signed off";
              } else if (diffInDays < 1) {
                dynamicStatus = "New";
              }

              return { ...r, dynamicStatus };
            } catch (err) {
              console.error("Error fetching case for report", r._id, err);
              return { ...r, dynamicStatus: "In progress" };
            }
          })
        );

        setAllReports(reportsWithStatus);
        setFilteredReports(reportsWithStatus);

        // Fetch tests/panels/packages for all reports
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

  // 1️⃣ Fetch all reports when branchId changes
useEffect(() => {
  fetchReports();
}, []);

// 2️⃣ When reports are loaded, auto-filter to today's date
useEffect(() => {
  if (allReports.length > 0) {
    const today = new Date().toISOString().split("T")[0];

    const todays = allReports.filter((r) => {
      const reportDate = new Date(r.createdAt).toISOString().split("T")[0];
      return reportDate === today;
    });

    setTodaysReports(todays);
    setFilteredReports(todays);

    // 🔥 Prevent infinite loop
    if (!filters.dailyCase) {
      setFilters(prev => ({ ...prev, dailyCase: today }));
    }
  }
}, [allReports, filters.dailyCase]);



// 💥 Recalculate todaysReports when date changes
useEffect(() => {
  if (!filters.dailyCase) return;

  const selected = allReports.filter((r) => {
    const reportDate = new Date(r.createdAt).toISOString().split("T")[0];
    return reportDate === filters.dailyCase;
  });

  setTodaysReports(selected);

  // Also reset filtered reports to the new date
  setFilteredReports(selected);

  setActiveTab("All");

}, [filters.dailyCase, allReports]);




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
  let results = [...todaysReports];

  // 🔍 Patient search (first name + last name)
  if (filters.patient) {
    const keyword = filters.patient.toLowerCase();
    results = results.filter((r) => {
      const fullName = `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase();
      return fullName.includes(keyword);
    });
  }

  // 🔍 Status
  if (filters.status) {
    results = results.filter((r) => r.dynamicStatus === filters.status);
  }

  // 🔍 Referred By
  if (filters.referredBy) {
    results = results.filter((r) => r.patient.doctor === filters.referredBy);
  }

  // 🔍 Reg No
  if (filters.regNo) {
    results = results.filter((r) =>
      r.regNo.toLowerCase().includes(filters.regNo.toLowerCase())
    );
  }

  // 🔍 Date
  if (filters.dailyCase) {
    results = results.filter((r) => {
      const reportDate = new Date(r.createdAt).toISOString().split("T")[0];
      return reportDate === filters.dailyCase;
    });
  }

  // 🔍 UHID
  if (filters.uhid) {
    results = results.filter((r) =>
      (r.uhid || "").toLowerCase().includes(filters.uhid.toLowerCase())
    );
  }

  // 🔍 Test / Panel / Package search
  if (filters.test) {
    const t = filters.test.toLowerCase();
    results = results.filter((r) =>
      testDetailsMap[r._id]?.some((item) => {
        const name = item?.data?.name?.toLowerCase() || "";
        return name.includes(t);
      })
    );
  }

  // 🔍 Date Range (optional filters)
  if (filters.from) {
    results = results.filter(
      (r) => new Date(r.createdAt) >= new Date(filters.from)
    );
  }

  if (filters.to) {
    results = results.filter(
      (r) => new Date(r.createdAt) <= new Date(filters.to)
    );
  }

  // ⬆️ Apply final results
  setFilteredReports(results);
  setPage(1);
};


  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);

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
  <div className="p-6">

    {/* Heading + Recent changes */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        Reports for today 
        <span className="text-yellow-500 text-lg">✨</span>
      </h1>

      
    </div>

    {/* Search + Date Navigation */}
    <div className="flex items-center gap-3 mb-6">

      {/* Search in page */}
      <input
        type="text"
        placeholder="Search in page"
        className="border px-3 py-2 rounded-md w-64"
        name="patient"
        value={filters.patient}
        onChange={handleFilterChange}
      />

      {/* Left arrow */}
      <button 
        className="border rounded-md p-2 text-gray-600"
        onClick={() => {
          const d = new Date(filters.dailyCase);
          d.setDate(d.getDate() - 1);
          setFilters(prev => ({ ...prev, dailyCase: d.toISOString().split("T")[0] }));
          handleSearch();
        }}
      >
        ◀
      </button>

      {/* Date Picker */}
      <input
        type="date"
        name="dailyCase"
        value={filters.dailyCase}
        onChange={handleFilterChange}
        className="border px-3 py-2 rounded-md"
      />

      {/* Right arrow */}
      <button 
        className="border rounded-md p-2 text-gray-600"
        onClick={() => {
          const d = new Date(filters.dailyCase);
          d.setDate(d.getDate() + 1);
          setFilters(prev => ({ ...prev, dailyCase: d.toISOString().split("T")[0] }));
          handleSearch();
        }}
      >
        ▶
      </button>

      {/* Go to dropdown */}
      
      {/* Sort dropdown */}
      <select 
        className="border px-3 py-2 rounded-md ml-auto text-sm"
        onChange={(e) => {
          const sorted = [...filteredReports].sort((a, b) => {
            if (e.target.value === "Oldest") return new Date(a.createdAt) - new Date(b.createdAt);
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          setFilteredReports(sorted);
        }}
      >
        <option value="Oldest">Sort: Oldest first</option>
        <option value="Newest">Sort: Newest first</option>
      </select>

      {/* Printed count */}
      <div className="text-gray-600 ml-4">
        {filteredReports.filter(r => r.printed).length}/{filteredReports.length} Printed
      </div>
    </div>

    {/* Tabs */}
    <div className="flex items-center gap-6 border-b mb-4 text-sm">

  {[
    ["All", todaysReports.length],
    ["New", todaysReports.filter(r => r.dynamicStatus === "New").length],
    ["In progress", todaysReports.filter(r => r.dynamicStatus === "In progress").length],
    ["Signed off", todaysReports.filter(r => r.dynamicStatus === "Signed off").length],
  ].map(([label, count]) => (
    <button
      key={label}
      onClick={() => {
        setActiveTab(label);   // <-- update active tab
        if (label === "All") return setFilteredReports(todaysReports);
        setFilteredReports(todaysReports.filter(r => r.dynamicStatus === label));
      }}
      className="pb-2 relative"
    >
      <span className={`font-medium ${activeTab === label ? "text-blue-600" : ""}`}>
        {label}
      </span>
      <span className="ml-1 text-gray-500">{count}</span>

      {/* ACTIVE UNDERLINE */}
      {activeTab === label && (
        <div className="absolute left-0 right-0 -bottom-[2px] h-[2px] bg-blue-600"></div>
      )}
    </button>
  ))}

</div>



    {/* Table */}
    <div className="border rounded-lg overflow-x-auto shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="p-3 text-left">PAT. ID</th>
            <th className="p-3 text-left">TIME</th>
            <th className="p-3 text-left">PATIENT</th>
            <th className="p-3 text-left">REFERRED BY</th>
            <th className="p-3 text-left">TESTS</th>
            <th className="p-3 text-left">CC</th>
            <th className="p-3 text-left">STATUS</th>
            <th className="p-3 text-left">ACTIONS</th>
          </tr>
        </thead>

        <tbody>
          {paginatedReports.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center py-6 text-gray-500">
                No reports found
              </td>
            </tr>
          ) : (
            paginatedReports.map((r) => (
              <tr key={r._id} className="border-b hover:bg-gray-50">
                <td className="p-3">{r.regNo}<br /><span className="text-xs text-gray-400">{r.caseNo}</span></td>

                <td className="p-3">
                  {new Date(r.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>

                <td className="p-3 font-medium">
                  {r.patient.firstName} {r.patient.lastName}
                  <br />
                  <span className="text-xs text-gray-500">
                    {r.patient.age} YRS / {r.patient.gender}
                  </span>
                </td>

                <td className="p-3">{r.patient.doctor || "-"}</td>

                <td className="p-3">
                  {testDetailsMap[r._id]?.map((t) => {
                    if (t.type === "TEST") return t.data.name;
                    if (t.type === "PANEL") return `Panel: ${t.data.name}`;
                    if (t.type === "PACKAGE") return `Package: ${t.data.name}`;
                  }).join(", ") || "Loading..."}
                </td>

                <td className="p-3">{r.collectionCentre || "Main"}</td>

                <td className="p-3">
                  <span className={getStatusStyle(r.dynamicStatus)}>
                    {r.dynamicStatus}
                  </span>
                </td>

                <td className="p-3 flex flex-col gap-1">
                  <button
                    onClick={() => navigate(`/admin/bill/${r._id}`)}
                    className="text-blue-600 text-sm"
                  >
                    View
                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        `/admin/${r.dynamicStatus === "Signed off" ? "edit-result" : "enter-result"}/${r._id}`
                      )
                    }
                    className="text-gray-600 text-sm"
                  >
                    {r.dynamicStatus === "Signed off" ? "Edit results" : "Enter results"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="flex justify-center items-center mt-6 gap-3">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
        className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
      >
        Prev
      </button>

      <span className="text-sm">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
        className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>

  </div>
);

}

export default TodaysAdminreports
