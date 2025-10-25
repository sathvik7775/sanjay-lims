import React, { useState, useEffect, useContext } from "react";

import axios from "axios";
import { LabContext } from "../context/LabContext";

export default function Dashboard() {
  const { branchId, branchToken, errorToast, navigate } = useContext(LabContext);

  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all cases
  const fetchCases = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${branchToken}` } };
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cases/branch/list/${branchId}`,
        config
      );

      if (response.data.success) {
        setAllCases(response.data.data);
      } else {
        errorToast(response.data.message || "Failed to fetch cases");
      }
    } catch (err) {
      console.error(err);
      errorToast(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) fetchCases();
  }, [branchId]);

  if (loading) return <p className="p-6 text-gray-500">Loading dashboard...</p>;

  // Payments due = total > paid
  const paymentsDue = allCases
    .filter((c) => c.payment.total > c.payment.received)
    .map((c) => ({
      id: c._id,
      patient: `${c.patient.firstName} ${c.patient.lastName}`,
      regNo: c.regNo,
      date: new Date(c.createdAt).toLocaleDateString("en-GB"),
      due: `Rs.${(c.payment.total - c.payment.received).toLocaleString()}`,
    }));

  // Recent transactions = sorted by most recent
  const recentTransactions = allCases
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 7)
    .map((c) => ({
      id: c._id,
      patient: `${c.patient.firstName} ${c.patient.lastName}`,
      regNo: c.regNo,
      amount: `Rs.${c.payment.received.toLocaleString()}`,
    }));

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Payments Due */}
      <div className="border rounded-lg shadow-sm bg-white p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Payments due</h2>
          <button onClick={()=> navigate(`/${branchId}/all-cases`)} className="text-blue-600 text-sm cursor-pointer">View all</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">For all time</p>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">PATIENT</th>
              <th className="p-2 text-left">DUE</th>
              <th className="p-2 text-left">ACCEPT DUE</th>
            </tr>
          </thead>
          <tbody>
            {paymentsDue.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  No payments due
                </td>
              </tr>
            ) : (
              paymentsDue.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <div className="font-medium">{p.patient}</div>
                    <div className="text-gray-500 text-xs">
                      Reg. {p.regNo} | {p.date}
                    </div>
                  </td>
                  <td className="p-2">{p.due}</td>
                  <td className="p-2">
                    <button className="text-blue-600">↻</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Transactions */}
      <div className="border rounded-lg shadow-sm bg-white p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Recent transactions</h2>
          <button onClick={()=> navigate(`/${branchId}/all-cases`)} className="text-blue-600 text-sm cursor-pointer">View all</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Most recent</p>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">PATIENT</th>
              <th className="p-2 text-left">AMOUNT</th>
              <th  className="p-2 text-left">VIEW BILL</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  No recent transactions
                </td>
              </tr>
            ) : (
              recentTransactions.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <div className="font-medium">{t.patient}</div>
                    <div className="text-gray-500 text-xs">Reg. no. {t.regNo}</div>
                  </td>
                  <td className="p-2">{t.amount}</td>
                  <td
                    className="p-2 text-blue-600 cursor-pointer"
                    onClick={() => navigate(`/${branchId}/bill/${t.id}`)}
                  >
                    View bill
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
