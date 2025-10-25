import React, { useContext, useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { LabContext } from "../../../context/LabContext";
import axios from "axios";

const AdminCases = () => {
  const { adminToken, navigate } = useContext(LabContext);
  const [branches, setBranches] = useState([]);
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  const [filters, setFilters] = useState({
    duration: "Past 7 days",
    fromDate: "",
    toDate: "",
    regNo: "",
    patientName: "",
    referredBy: "",
    collectionCentre: "",
    sampleAgent: "",
    branch: "",
    hasDue: false,
    cancelled: false,
  });

  // 🔹 Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/branch/list`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log(res.data);
        
        setBranches(res.data.branches || []);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, [adminToken]);

  // 🔹 Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/cases/admin/list`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log("cases", res.data);
        
        setCases(res.data.data || []);
        setFilteredCases(res.data.data || []);
      } catch (err) {
        console.error("Error fetching cases:", err);
      }
    };
    fetchCases();
  }, [adminToken]);

  // 🔹 Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 🔹 Clear filters
  const handleClear = () => {
    setFilters({
      duration: "Past 7 days",
      fromDate: "",
      toDate: "",
      regNo: "",
      patientName: "",
      referredBy: "",
      collectionCentre: "",
      sampleAgent: "",
      branch: "",
      hasDue: false,
      cancelled: false,
    });
    setFilteredCases(cases);
  };

  // 🔹 Filter logic
  const handleSearch = () => {
    let results = [...cases];

    if (filters.regNo)
      results = results.filter((c) =>
        c.regNo.toLowerCase().includes(filters.regNo.toLowerCase())
      );

    if (filters.patientName)
      results = results.filter((c) =>
        `${c.patient?.firstName || ""} ${c.patient?.lastName || ""}`
          .toLowerCase()
          .includes(filters.patientName.toLowerCase())
      );

    if (filters.referredBy)
      results = results.filter((c) => c.referredBy === filters.referredBy);

    if (filters.collectionCentre)
      results = results.filter(
        (c) => c.center === filters.collectionCentre
      );

    if (filters.sampleAgent)
      results = results.filter((c) =>
        c.agent.toLowerCase().includes(filters.sampleAgent.toLowerCase())
      );

    if (filters.hasDue)
      results = results.filter(
        (c) => (c.payment?.total || 0) > (c.payment?.received || 0)
      );

    if (filters.cancelled)
      results = results.filter((c) => c.cancelled);

    if (filters.branch)
      results = results.filter((c) => c.branchId === filters.branch);

    if (filters.fromDate)
      results = results.filter(
        (c) => new Date(c.createdAt || c.date) >= new Date(filters.fromDate)
      );

    if (filters.toDate)
      results = results.filter(
        (c) => new Date(c.createdAt || c.date) <= new Date(filters.toDate)
      );

    setFilteredCases(results);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">All Cases (Admin View)</h1>

      {/* 🔹 Filters */}
      <div className="grid md:grid-cols-6 grid-cols-2 gap-4 mb-6 items-end">
        <select
          name="duration"
          value={filters.duration}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        >
          <option>Today</option>
          <option>Past 7 days</option>
          <option>Past 30 days</option>
          <option>Custom range</option>
        </select>

        <input
          type="date"
          name="fromDate"
          value={filters.fromDate}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        />
        <input
          type="date"
          name="toDate"
          value={filters.toDate}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        />

        <select
          name="branch"
          value={filters.branch}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        >
          <option value="">Select Branch</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name} ({b.place})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Reg. no"
          name="regNo"
          value={filters.regNo}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        />
        <input
          type="text"
          placeholder="Patient name"
          name="patientName"
          value={filters.patientName}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        />
        <select
          name="referredBy"
          value={filters.referredBy}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        >
          <option value="">Referred by</option>
          <option>MEDIBUDDY TPA</option>
          <option>HEALTHINDIA TPA</option>
          <option>GOWELNEXT TPA</option>
          <option>SELF</option>
          <option>APOLLO CLINIC</option>
          <option>STAR HEALTH</option>
        </select>

        <select
          name="collectionCentre"
          value={filters.collectionCentre}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        >
          <option value="">Collection centre</option>
          <option>Main</option>
          <option>Centre A</option>
          <option>Centre B</option>
        </select>

        <input
          type="text"
          placeholder="Sample agent"
          name="sampleAgent"
          value={filters.sampleAgent}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        />

        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            name="hasDue"
            checked={filters.hasDue}
            onChange={handleFilterChange}
          />
          <span>Has due</span>
        </label>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            name="cancelled"
            checked={filters.cancelled}
            onChange={handleFilterChange}
          />
          <span>Cancelled</span>
        </label>

        <div className="flex space-x-2 col-span-2">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm"
          >
            Search
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-200 px-4 py-1 rounded-md text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 🔹 Cases Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Branch</th>
              <th className="p-3 text-left">REG. NO.</th>
              <th className="p-3 text-left">DATE</th>
              <th className="p-3 text-left">PATIENT</th>
              <th className="p-3 text-left">REFERRED BY</th>
              <th className="p-3 text-left">TOTAL</th>
              <th className="p-3 text-left">PAID</th>
              <th className="p-3 text-left">DISCOUNT</th>
              <th className="p-3 text-left">STATUS</th>
              <th className="p-3 text-left">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-gray-500">
                  No results found
                </td>
              </tr>
            ) : (
              filteredCases.map((c, i) => {
                const branch = branches.find((b) => b._id.toString() === (c.branchId?._id || c.branchId)?.toString());

                const created = new Date(c.createdAt || c.date);

                return (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">{branch?.name || "N/A"}</td>
                    <td className="p-3">{c.regNo}</td>
                    <td className="p-3">
                      {created.toLocaleDateString("en-GB")}
                      <br />
                      {created.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td className="p-3">
                      {c.patient?.title} {c.patient?.firstName}{" "}
                      {c.patient?.lastName} <br />
                      <span className="text-gray-500 text-xs">
                        📞 {c.patient?.mobile}
                      </span>
                    </td>
                    <td className="p-3">{c.patient?.doctor}</td>
                    <td className="p-3">Rs.{c.payment?.total}</td>
                    <td className="p-3">Rs.{c.payment?.received}</td>
                    <td className="p-3">Rs.{c.payment?.discount}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs ${
                          c.cancelled
                            ? "bg-red-500 text-white"
                            : c.payment?.total > c.payment?.received
                            ? "bg-yellow-500 text-white"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        {c.cancelled ? "Cancelled" : c.status}
                      </span>
                    </td>
                    <td className="p-3 relative">
                      <button onClick={()=> navigate(`/admin/bill/${c._id}`)} className="text-blue-600 text-sm mr-2">
                        View bill
                      </button>
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === i ? null : i)
                        }
                      >
                        <MoreHorizontal className="inline-block w-5 h-5" />
                      </button>
                      {openMenu === i && (
                        <div className="absolute right-0 mt-2 bg-white border shadow-md rounded-md z-10">
                          <button onClick={()=> navigate(`/admin/edit-case/${c._id}`)} className="px-4 py-2 text-primary hover:bg-gray-100 w-full text-left">
                            Modify
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCases;
