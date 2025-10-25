import React, { useContext, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { LabContext } from "../../../context/LabContext";

const AdminTransactions = () => {
  const { adminToken, branchId, navigate } = useContext(LabContext);
  const [branches, setBranches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const [filters, setFilters] = useState({
    duration: "Past 7 days",
    paymentMode: "",
    collectionCentre: "",
    type: "",
    branch: "",
  });

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

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

  // 🔹 Fetch transactions (cases)
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/cases/admin/list`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        const cases = res.data.data || [];

        // Convert cases into transaction-friendly format
        const mapped = cases.map((c) => {
   // branchId from case: can be string or object
  const branchIdStr = c.branchId?._id ? c.branchId._id.toString() : c.branchId?.toString();

  // find branch
  const branch = branches.find((b) => b._id === branchIdStr) || {};

  console.log("BranchId:", branchIdStr, "→ Found:", branch.name);
    

    
    

  return {
    id: c._id,
    regNo: c.regNo || "N/A",
    dcn: c.dcn || "N/A", 
    patientName: `${c.patient?.firstName || ""} ${c.patient?.lastName || ""}`,
    referredBy: c.patient?.doctor || "SELF",
    date: new Date(c.createdAt).toLocaleDateString("en-GB"),
    time: new Date(c.createdAt).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    cc: c.center || "Main",
    type: c.status === "due" ? "Pending" : "Income",
    amount: c.payment?.total || 0,
    method: c.payment?.mode || "Cash",
    receivedBy: branch?.name || "N/A", // ✅ show branch name as receiver
        // ✅ show branch name
    branch: branch?.name || "N/A",     // ✅ show branch name
  };
});

        setTransactions(mapped);
        setFilteredTransactions(mapped);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    };
    fetchTransactions();
  }, [adminToken]);

  // 🔹 Handle filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    let results = [...transactions];

    if (filters.paymentMode)
      results = results.filter(
        (t) => t.method.toLowerCase() === filters.paymentMode.toLowerCase()
      );

    if (filters.collectionCentre)
      results = results.filter(
        (t) => t.cc.toLowerCase() === filters.collectionCentre.toLowerCase()
      );

    if (filters.type)
      results = results.filter(
        (t) => t.type.toLowerCase() === filters.type.toLowerCase()
      );

    if (filters.branch)
      results = results.filter(
        (t) => t.branch.toLowerCase() === filters.branch.toLowerCase()
      );

    setFilteredTransactions(results);
    setPage(1);
  };

  const handleClear = () => {
    setFilters({
      duration: "Past 7 days",
      paymentMode: "",
      collectionCentre: "",
      type: "",
      branch: "",
    });
    setFilteredTransactions(transactions);
    setPage(1);
  };

  // 🔹 Pagination
  const paginatedData = filteredTransactions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>

      {/* 🔹 Filters */}
      <div className="border rounded-lg shadow-sm mb-6 bg-white p-4 grid grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Duration</label>
          <select
            name="duration"
            value={filters.duration}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2 text-sm"
          >
            <option>Past 7 days</option>
            <option>Past 30 days</option>
            <option>Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Payment mode</label>
          <select
            name="paymentMode"
            value={filters.paymentMode}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2 text-sm"
          >
            <option value="">Select mode</option>
            <option>Cash</option>
            <option>Card</option>
            <option>UPI</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Collection centre</label>
          <select
            name="collectionCentre"
            value={filters.collectionCentre}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2 text-sm"
          >
            <option value="">Select centre</option>
            <option>Main</option>
            <option>Centre A</option>
            <option>Centre B</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Type</label>
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2 text-sm"
          >
            <option value="">Select type</option>
            <option>Income</option>
            <option>Pending</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Branch</label>
          <select
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
            className="border rounded-md w-full p-2 text-sm"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b._id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-5 flex gap-2 justify-end mt-2">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Search
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-200 px-4 py-2 rounded-md text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 🔹 Table */}
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
              <th className="p-2 border">CC</th>
              <th className="p-2 border">DCN</th>
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
              paginatedData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-2 border">{i + 1 + (page - 1) * rowsPerPage}</td>
                  <td className="p-2 border">{row.regNo}</td>
                  <td className="p-2 border">{row.patientName}</td>
                  <td className="p-2 border">{row.referredBy}</td>
                  <td className="p-2 border">{row.date}</td>
                  <td className="p-2 border">{row.time}</td>
                  <td className="p-2 border">{row.cc}</td>
                  <td className="p-2 border">{row.dcn}</td>
                  <td className="p-2 border">{row.type}</td>
                  <td className="p-2 border">Rs.{row.amount}</td>
                  <td className="p-2 border">{row.method}</td>
                  <td className="p-2 border">{row.receivedBy}</td>
                  <td onClick={()=> navigate(`/admin/bill/${row.id}`)} className="p-2 border text-blue-600 cursor-pointer">
                    View bill
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </button>

        <span>
          Page {page} of {Math.ceil(filteredTransactions.length / rowsPerPage)}
        </span>

        <button
          disabled={page === Math.ceil(filteredTransactions.length / rowsPerPage)}
          onClick={() => setPage((p) => p + 1)}
          className="flex items-center border rounded-md px-3 py-1 disabled:opacity-50"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default AdminTransactions;
