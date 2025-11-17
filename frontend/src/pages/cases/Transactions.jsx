import React, { useState, useEffect, useContext } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";

export default function Transactions() {
  const { branchId, branchToken, errorToast, branchData, navigate } =
    useContext(LabContext);

  const [cases, setCases] = useState([]);
  const [mappedCases, setMappedCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [loading, setLoading] = useState(true);

  // ---------------- Filters ----------------
  const [filters, setFilters] = useState({
    duration: "Past 7 days",
    paymentMode: "",
    collectionCentre: "",
    type: "",
    from: "",
    to: "",
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
        setCases(response.data.data);
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

  // ---------------- Map cases to transaction format ----------------
  useEffect(() => {
    const mapped = cases.map((c) => ({
      id: c._id,
      regNo: c.regNo || "N/A",
      dcn: c.dcn || "N/A",
      patientName: `${c.patient?.firstName || ""} ${c.patient?.lastName || ""}`,
      referredBy: c.patient?.doctor || "SELF",
      date: new Date(c.createdAt || c.date).toLocaleDateString("en-GB"),
      rawDate: new Date(c.createdAt || c.date), // for filtering
      time: new Date(c.createdAt || c.date).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      cc: c.center || "Main",
      type: c.status === "due" ? "Pending" : "Income",
      amount: c.payment?.total || 0,
      method: c.payment?.mode || "Cash",
      receivedBy: branchData?.name || "N/A",
    }));

    setMappedCases(mapped);
    setFilteredCases(mapped);
  }, [cases]);

  // ---------------- Filters Handler ----------------
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------- Apply Filters ----------------
  const handleSearch = () => {
    let results = [...mappedCases];
    const today = new Date();

    // Payment mode
    if (filters.paymentMode)
      results = results.filter(
        (t) => t.method.toLowerCase() === filters.paymentMode.toLowerCase()
      );

    // CC
    if (filters.collectionCentre)
      results = results.filter(
        (t) =>
          t.cc.toLowerCase() === filters.collectionCentre.toLowerCase()
      );

    // Type
    if (filters.type)
      results = results.filter(
        (t) => t.type.toLowerCase() === filters.type.toLowerCase()
      );

    // Duration filters
    if (filters.duration === "Past 7 days") {
      const d = new Date();
      d.setDate(today.getDate() - 7);

      results = results.filter(
        (t) => t.rawDate >= d && t.rawDate <= today
      );
    }

    if (filters.duration === "Past 30 days") {
      const d = new Date();
      d.setDate(today.getDate() - 30);

      results = results.filter(
        (t) => t.rawDate >= d && t.rawDate <= today
      );
    }

    // Custom date range
    if (filters.duration === "Custom" && filters.from && filters.to) {
      const from = new Date(filters.from);
      const to = new Date(filters.to);

      results = results.filter(
        (t) => t.rawDate >= from && t.rawDate <= to
      );
    }

    setFilteredCases(results);
    setPage(1);
  };

  // ---------------- Clear Filters ----------------
  const handleClear = () => {
    setFilters({
      duration: "Past 7 days",
      paymentMode: "",
      collectionCentre: "",
      type: "",
      from: "",
      to: "",
    });
    setFilteredCases(mappedCases);
    setPage(1);
  };

  // ---------------- Pagination ----------------
  const paginatedData = filteredCases.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) return <p className="p-6 text-gray-500">Loading cases...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>

      {/* Filters */}
      <div className="border rounded-lg shadow-sm mb-6 bg-white p-4 grid grid-cols-5 gap-4 items-end">

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium">Duration</label>
          <select
            name="duration"
            value={filters.duration}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2"
          >
            <option>Past 7 days</option>
            <option>Past 30 days</option>
            <option>Custom</option>
          </select>
        </div>

        {/* Custom Calendar */}
        {filters.duration === "Custom" && (
          <div className="flex gap-2 col-span-2">
            <div>
              <label className="text-sm">From</label>
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className="border rounded-md w-full p-2"
              />
            </div>

            <div>
              <label className="text-sm">To</label>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className="border rounded-md w-full p-2"
              />
            </div>
          </div>
        )}

        {/* Payment Mode */}
        <div>
          <label className="block text-sm font-medium">Payment mode</label>
          <select
            name="paymentMode"
            value={filters.paymentMode}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2"
          >
            <option value="">Select mode</option>
            <option>Cash</option>
            <option>Card</option>
            <option>UPI</option>
          </select>
        </div>

        {/* CC */}
        <div>
          <label className="block text-sm font-medium">Collection centre</label>
          <select
            name="collectionCentre"
            value={filters.collectionCentre}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2"
          >
            <option value="">Collection centre</option>
          <option value="Main">Main</option>
          <option value="Home visit">Home visit</option>
          <option value="Center visit">Center visit</option>
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2"
          >
            <option value="">Select type</option>
            <option>Income</option>
            <option>Pending</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="col-span-5 flex gap-2 justify-end mt-2">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Search
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-200 px-4 py-2 rounded-md"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">REG. NO.</th>
              <th className="p-2 border">PATIENT NAME</th>
              <th className="p-2 border">REFERRED BY</th>
              <th className="p-2 border">DATE</th>
              <th className="p-2 border">TIME</th>
              <th className="p-2 border">DCN</th>
              <th className="p-2 border">CC</th>
              <th className="p-2 border">TYPE</th>
              <th className="p-2 border">AMOUNT</th>
              <th className="p-2 border">METHOD</th>
              <th className="p-2 border">RECEIVED BY</th>
              <th className="p-2 border">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center py-4 text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{row.id}</td>
                  <td className="p-2 border">{row.regNo}</td>
                  <td className="p-2 border">{row.patientName}</td>
                  <td className="p-2 border">{row.referredBy}</td>
                  <td className="p-2 border">{row.date}</td>
                  <td className="p-2 border">{row.time}</td>
                  <td className="p-2 border">{row.dcn}</td>
                  <td className="p-2 border">{row.cc}</td>
                  <td className="p-2 border">{row.type}</td>
                  <td className="p-2 border">Rs.{row.amount}</td>
                  <td className="p-2 border">{row.method}</td>
                  <td className="p-2 border">{row.receivedBy}</td>
                  <td
                    onClick={() => navigate(`/${branchId}/bill/${row.id}`)}
                    className="p-2 border text-blue-600 cursor-pointer"
                  >
                    View bill
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </button>

        <span>
          Page {page} of {Math.ceil(filteredCases.length / rowsPerPage)}
        </span>

        <button
          disabled={page === Math.ceil(filteredCases.length / rowsPerPage)}
          onClick={() => setPage((p) => p + 1)}
          className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
