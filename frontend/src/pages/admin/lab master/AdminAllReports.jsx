import React, { useState, useEffect, useContext } from "react";

import axios from "axios";

import {
  Eye,
  Pencil,
  MoreHorizontal,
  ChevronDown,
  Calendar,
  Search,
} from "lucide-react";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";

export default function AdminAllReports() {
  const { branchId, branchToken, navigate, errorToast, doctors, dummyPanels, dummyTests, packages, adminToken } =
    useContext(LabContext);

  const [allReports, setAllReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [testDetailsMap, setTestDetailsMap] = useState({});

  const combinedTests = [
    ...dummyTests.map(t => ({ type: "TEST", name: t.name })),
    ...dummyPanels.map(p => ({ type: "PANEL", name: p.name })),
    ...packages.map(pkg => ({ type: "PACKAGE", name: pkg.name }))
  ];


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

  const extractId = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    if (item._id) return item._id.toString();
    return null;
  };

  // Fetch TEST / PANEL / PACKAGE
  const fetchItemDetails = async (id) => {
    const safeId = extractId(id);
    if (!safeId) return null;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success && res.data.data)
        return { type: "TEST", data: res.data.data };
    } catch { }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success && res.data.data)
        return { type: "PANEL", data: res.data.data };
    } catch { }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/test/packages/admin/package/${safeId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success && res.data.data)
        return { type: "PACKAGE", data: res.data.data };
    } catch { }

    return null;
  };

  const fetchTestsForReport = async (report) => {
    const ids = [
      ...(report.tests?.LAB || []),
      ...(report.tests?.PANELS || []),
      ...(report.tests?.PACKAGES || []),
    ];

    const details = await Promise.all(ids.map(fetchItemDetails));
    setTestDetailsMap((prev) => ({
      ...prev,
      [report._id]: details.filter(Boolean),
    }));
  };

  // Fetch all reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cases/admin/list`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (!res.data.success) {
        errorToast("Failed to fetch reports");
        return;
      }

      const reports = res.data.data || [];

      const withStatus = await Promise.all(
        reports.map(async (r) => {
          try {
            const result = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/results/admin/report/${r._id}`,
              { headers: { Authorization: `Bearer ${adminToken}` } }
            );

            const today = new Date();
            const diff =
              (today - new Date(r.createdAt)) / (1000 * 60 * 60 * 24);

            if (result.data.success && result.data.data)
              return { ...r, dynamicStatus: "Signed off" };
            if (diff < 1) return { ...r, dynamicStatus: "New" };
            return { ...r, dynamicStatus: "In progress" };
          } catch {
            return { ...r, dynamicStatus: "In progress" };
          }
        })
      );

      setAllReports(withStatus);
      setFilteredReports(withStatus);

      withStatus.forEach(fetchTestsForReport);
    } catch (err) {
      errorToast("Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) fetchReports();
  }, [branchId]);

  // TEST Column 2-line truncation
  const testsToTwoLines = (items) => {
    if (!items) return "Loading...";

    const names = items.map((t) => t.data.name);
    const full = names.join(", ");

    // manual 2-line truncation
    const approxChars = 90;
    if (full.length <= approxChars) return full;

    return full.substring(0, approxChars) + "...";
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    let results = [...allReports];

    if (filters.patient) {
      const kw = filters.patient.toLowerCase();
      results = results.filter((r) =>
        `${r.patient.firstName} ${r.patient.lastName}`
          .toLowerCase()
          .includes(kw)
      );
    }

    if (filters.regNo)
      results = results.filter((r) =>
        r.regNo.toLowerCase().includes(filters.regNo.toLowerCase())
      );

    if (filters.uhid)
      results = results.filter((r) =>
        (r.uhid || "").toLowerCase().includes(filters.uhid.toLowerCase())
      );

    if (filters.status)
      results = results.filter((r) => r.dynamicStatus === filters.status);

    if (filters.referredBy)
      results = results.filter((r) => r.patient.doctor === filters.referredBy);

    if (filters.from)
      results = results.filter(
        (r) => new Date(r.createdAt) >= new Date(filters.from)
      );

    if (filters.to)
      results = results.filter(
        (r) => new Date(r.createdAt) <= new Date(filters.to)
      );

    if (filters.test) {
      const tkw = filters.test.toLowerCase();
      results = results.filter((r) =>
        testDetailsMap[r._id]?.some((t) =>
          t.data.name.toLowerCase().includes(tkw)
        )
      );
    }

    setFilteredReports(results);
    setPage(1);
  };

  const totalPages = Math.ceil(filteredReports.length / pageSize);
  const paginated = filteredReports.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (loading) return <Loader />;

  return (
    <div className="p-6 bg-white">
      <h1 className="text-3xl font-semibold mb-6">Search lab reports</h1>

      {/* FILTER BAR */}
      <div className="p-3 border rounded-lg bg-gray-50 grid grid-cols-4 gap-3">

        {/* Duration */}
        <div className="col-span-1">
          <label className="text-gray-600 text-xs mb-1 block">Duration</label>
          <div className="flex items-center border rounded-md px-2 py-1.5 bg-white">
            <Calendar size={16} className="mr-2 text-gray-500" />
            <select
              name="duration"
              value={filters.duration}
              onChange={handleFilterChange}
              className="w-full outline-none text-sm"
            >
              <option>Past 7 days</option>
              <option>Past 30 days</option>
              <option>Custom</option>
            </select>
          </div>
        </div>

        {/* From */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">From</label>
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          />
        </div>

        {/* To */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">To</label>
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          />
        </div>

        {/* Patient name */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">Patient first name</label>
          <input
            type="text"
            name="patient"
            value={filters.patient}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          >
            <option value="">Select status</option>
            <option>New</option>
            <option>In progress</option>
            <option>Signed off</option>
          </select>
        </div>

        {/* Referred by */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">Referred by</label>
          <select
            name="referredBy"
            value={filters.referredBy}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          >
            <option value="">Select referrer</option>

            {doctors?.map((doc, i) => (
              <option key={i} value={doc.name}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>


        {/* Reg No */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">Reg no.</label>
          <input
            type="text"
            name="regNo"
            value={filters.regNo}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          />
        </div>

        {/* Daily case */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">Daily case no.</label>
          <input
            type="text"
            name="dailyCase"
            value={filters.dailyCase}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          />
        </div>

        {/* UHID */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">UHID</label>
          <input
            type="text"
            name="uhid"
            value={filters.uhid}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          />
        </div>

        {/* Select test */}
        <div>
          <label className="text-gray-600 text-xs mb-1 block">Select test</label>
          <select
            name="test"
            value={filters.test}
            onChange={handleFilterChange}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          >
            <option value="">Select test / panel / package</option>

            {combinedTests.map((item, i) => (
              <option key={i} value={item.name}>
                {item.type === "TEST" && "🧪"}
                {item.type === "PANEL" && "📋"}
                {item.type === "PACKAGE" && "📦"}
                {" "}
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-end gap-2 col-span-4 justify-end mt-1">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-md flex items-center gap-1 text-sm"
          >
            <Search size={16} /> Search
          </button>

          <button
            onClick={() => window.location.reload()}
            className="bg-gray-200 px-4 py-1.5 text-sm rounded-md"
          >
            Clear
          </button>
        </div>

      </div>


      {/* TABLE */}
      <div className="mt-6 border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3">PAT. ID</th>
              <th className="p-3">DATE/TIME</th>
              <th className="p-3">PATIENT</th>
              <th className="p-3">REFERRED BY</th>
              <th className="p-3">TESTS</th>
              <th className="p-3">CC</th>
              <th className="p-3">STATUS</th>
              <th className="p-3">ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center text-gray-500 py-6"
                >
                  No results found
                </td>
              </tr>
            ) : (
              paginated.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  {/* PAT ID */}
                  <td className="p-3">
                    <div className="font-medium text-blue-700">
                      #{r.regNo}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.caseNo}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.dcn}
                    </div>
                    <div className="text-xs text-gray-500">
                      UHID: {r.patient.uhid}
                    </div>
                  </td>

                  {/* DATE */}
                  <td className="p-3">
                    {new Date(r.createdAt).toLocaleDateString("en-GB")}
                    <br />
                    {new Date(r.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>

                  {/* PATIENT */}
                  <td className="p-3">
                    <div className="font-medium">
                      {r.patient.firstName} {r.patient.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.patient.age} YRS / {r.patient.sex}
                    </div>
                  </td>

                  {/* REFERRED BY */}
                  <td className="p-3">{r.patient.doctor || "-"}</td>

                  {/* TESTS with tooltip */}
                  <td className="p-3 relative group">

                    <div className="line-clamp-2 max-w-xs cursor-pointer">
                      {testsToTwoLines(testDetailsMap[r._id])}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute hidden group-hover:block left-0 mt-2 z-20 bg-black text-white p-3 rounded-md text-xs w-64 shadow-xl">
                      {testDetailsMap[r._id]
                        ?.map((t) => t.data.name)
                        .join(", ")}
                    </div>
                  </td>

                  {/* CC */}
                  <td className="p-3">{r.collectionCentre || "Main"}</td>

                  {/* STATUS */}
                  {/* STATUS */}
                  <td className="p-3">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`px-2 py-1 text-xs rounded-md font-medium text-white whitespace-nowrap
                          ${r.dynamicStatus === "Signed off"
                            ? "bg-green-500"
                            : r.dynamicStatus === "New"
                            ? "bg-blue-500"
                            : "bg-yellow-500"}
                        `}
                      >
                        {r.dynamicStatus}
                      </span>
                  
                      {localStorage.getItem(r._id) === "printed" && (
                        <span className="px-2 py-1 text-xs rounded-md bg-green-600 text-white flex items-center gap-1">
                          ✔ Printed
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* ACTIONS */}
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                  
                      <button
                        onClick={() => navigate(`/${branchId}/bill/${r._id}`)}
                        className="text-blue-600 flex items-center gap-1"
                      >
                        <Eye size={15} /> View
                      </button>
                  
                      <button
                        onClick={() =>
                          navigate(
                            `/${branchId}/${r.dynamicStatus === "Signed off"
                              ? "edit-result"
                              : "enter-result"
                            }/${r._id}`
                          )
                        }
                        className="text-gray-700 flex items-center gap-1"
                      >
                        <Pencil size={15} />
                        {r.dynamicStatus === "Signed off" ? "Edit results" : "Enter results"}
                      </button>
                  
                      <MoreHorizontal
                        size={18}
                        className="text-gray-500 cursor-pointer"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          className="px-3 py-1 border rounded-md"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          className="px-3 py-1 border rounded-md"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
