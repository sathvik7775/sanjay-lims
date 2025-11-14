import React, { useState, useEffect, useContext } from "react";
import { MoreHorizontal } from "lucide-react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";

const AllCases = () => {
  const { branchId, navigate, branchToken, errorToast } = useContext(LabContext);

  const [openMenu, setOpenMenu] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default today
  const today = new Date().toISOString().split("T")[0];

  const [filters, setFilters] = useState({
    duration: "Today",
    fromDate: today,
    toDate: today,
    regNo: "",
    patientName: "",
    referredBy: "",
    collectionCentre: "",
    sampleAgent: "",
    hasDue: false,
    cancelled: false,
  });

  // ---------------- Fetch cases ----------------
  const fetchCases = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${branchToken}` },
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cases/branch/list/${branchId}`,
        config
      );

      if (response.data.success) {
        const data = response.data.data;
        setAllCases(data);

        // 🔥 Auto filter today's cases
        const todaysFiltered = data.filter((c) => {
          const caseDate = new Date(c.createdAt || c.date)
            .toISOString()
            .split("T")[0];
          return caseDate === today;
        });

        setFilteredCases(todaysFiltered);
      } else {
        errorToast(response.data.message || "Failed to fetch cases");
      }
    } catch (error) {
      console.error("Fetch Cases Error:", error);
      errorToast(error.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) fetchCases();
  }, [branchId]);

  // ---------------- Filters ----------------
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "duration") {
      const today = new Date();
      let fromDate = "";
      let toDate = today.toISOString().split("T")[0];

      if (value === "Today") {
        fromDate = toDate;
      } else if (value === "Past 7 days") {
        const past = new Date();
        past.setDate(today.getDate() - 7);
        fromDate = past.toISOString().split("T")[0];
      } else if (value === "Past 30 days") {
        const past = new Date();
        past.setDate(today.getDate() - 30);
        fromDate = past.toISOString().split("T")[0];
      } else if (value === "Custom range") {
        fromDate = "";
        toDate = "";
      }

      setFilters((prev) => ({
        ...prev,
        duration: value,
        fromDate,
        toDate,
      }));

      return;
    }

    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Clear filters → Reset to Today
  const handleClear = () => {
    const today = new Date().toISOString().split("T")[0];

    setFilters({
      duration: "Today",
      fromDate: today,
      toDate: today,
      regNo: "",
      patientName: "",
      referredBy: "",
      collectionCentre: "",
      sampleAgent: "",
      hasDue: false,
      cancelled: false,
    });

    // Also reset to today's cases automatically
    const todaysFiltered = allCases.filter((c) => {
      const caseDate = new Date(c.createdAt || c.date)
        .toISOString()
        .split("T")[0];
      return caseDate === today;
    });

    setFilteredCases(todaysFiltered);
  };

  // Search handler
  const handleSearch = () => {
    let results = [...allCases];

    if (filters.regNo) {
      results = results.filter((c) =>
        c.regNo.toLowerCase().includes(filters.regNo.toLowerCase())
      );
    }

    if (filters.patientName) {
      results = results.filter((c) =>
        c.patient.firstName.toLowerCase().includes(filters.patientName.toLowerCase())
      );
    }

    if (filters.referredBy) {
      results = results.filter((c) => c.referredBy === filters.referredBy);
    }

    if (filters.collectionCentre) {
      results = results.filter((c) => c.collectionCentre === filters.collectionCentre);
    }

    if (filters.sampleAgent) {
      results = results.filter((c) =>
        c.agent?.toLowerCase().includes(filters.sampleAgent.toLowerCase())
      );
    }

    if (filters.hasDue) {
      results = results.filter((c) => c.payment.total > c.payment.received);
    }

    if (filters.cancelled) {
      results = results.filter((c) => c.cancelled);
    }

    // Date Filters
    if (filters.fromDate) {
      results = results.filter(
        (c) => new Date(c.date || c.createdAt) >= new Date(filters.fromDate)
      );
    }

    if (filters.toDate) {
      results = results.filter(
        (c) =>
          new Date(c.date || c.createdAt) <=
          new Date(filters.toDate + "T23:59:59")
      );
    }

    setFilteredCases(results);
  };

  if (loading) return <p className="p-6 text-gray-500">Loading cases...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">All cases</h1>

      {/* Filter Section */}
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

        {/* Date Filters in separate row */}
{/* Date Filters in separate row */}
<div className="md:col-span-2 col-span-2 grid grid-cols-2 gap-4">

  {/* FROM DATE */}
  <div className="flex flex-col">
    <label className="text-xs text-gray-600 mb-1">From</label>
    <input
      type="date"
      name="fromDate"
      value={filters.fromDate}
      onChange={handleFilterChange}
      className={`border rounded-md px-2 py-1 text-sm min-w-[140px]
        ${filters.duration !== "Custom range" ? "bg-gray-200" : ""}
      `}
    />
  </div>

  {/* TO DATE */}
  <div className="flex flex-col">
    <label className="text-xs text-gray-600 mb-1">To</label>
    <input
      type="date"
      name="toDate"
      value={filters.toDate}
      onChange={handleFilterChange}
      className={`border rounded-md px-2 py-1 text-sm min-w-[140px]
        ${filters.duration !== "Custom range" ? "bg-gray-200" : ""}
      `}
    />
  </div>

</div>




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
          placeholder="Patient first name"
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
        </select>

        <select
          name="collectionCentre"
          value={filters.collectionCentre}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm"
        >
          <option value="">Collection centre</option>
          <option>Centre A</option>
          <option>Centre B</option>
        </select>

        <input
          type="text"
          placeholder="Sample collection agent"
          name="sampleAgent"
          value={filters.sampleAgent}
          onChange={handleFilterChange}
          className="border rounded-md px-2 py-1 text-sm col-span-2"
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

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
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
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  No results found
                </td>
              </tr>
            ) : (
              filteredCases.map((c, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3">{c.regNo}</td>

                  <td className="p-3 text-wrap">
                    {new Date(c.createdAt || c.date).toLocaleDateString("en-GB")}
                    <br />
                    {new Date(c.createdAt || c.date).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>

                  <td className="p-3">
                    {c.patient.firstName} {c.patient.lastName} <br />
                    <span className="text-gray-500 text-xs">
                      📞 {c.patient.mobile}
                    </span>
                  </td>

                  <td className="p-3">{c.patient.doctor || c.referredBy}</td>

                  <td className="p-3">Rs.{c.payment.total}</td>
                  <td className="p-3">Rs.{c.payment.received}</td>
                  <td className="p-3">Rs.{c.payment.discount}</td>

                  <td className="p-3">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs">
                      {c.status}
                    </span>
                  </td>

                  <td className="p-3 relative">
                    <button
                      onClick={() => navigate(`/${branchId}/bill/${c._id}`)}
                      className="text-blue-600 text-sm mr-2"
                    >
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
                        <button
                          onClick={() =>
                            navigate(`/${branchId}/edit-case/${c._id}`)
                          }
                          className="px-4 py-2 text-red-500 hover:bg-gray-100 w-full text-left"
                        >
                          Modify
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllCases;
