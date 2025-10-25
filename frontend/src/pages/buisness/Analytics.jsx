import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LabContext } from "../../context/LabContext";

export default function Analytics() {
  const { branchId, branchToken, errorToast } = useContext(LabContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalPatients: 0,
    avgIncomePerPatient: 0,
    topDay: null,
  });

  useEffect(() => {
    if (!branchId) return;

    const fetchCases = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/cases/branch/list/${branchId}`,
          { headers: { Authorization: `Bearer ${branchToken}` } }
        );

        if (res.data.success && res.data.data) {
          const casesData = res.data.data;
          setCases(casesData);

          // --- Calculate total income and patients ---
          const totalIncome = casesData.reduce(
            (sum, c) => sum + (c.payment?.total || 0),
            0
          );
          const totalPatients = casesData.length;
          const avgIncomePerPatient = totalPatients
            ? Math.round(totalIncome / totalPatients)
            : 0;

          // --- Group cases by date for chart ---
          const groupedByDate = {};
          casesData.forEach((c) => {
            if (c.status !== "no due") return; // Only completed cases
            const date = new Date(c.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            });
            if (!groupedByDate[date]) groupedByDate[date] = { income: 0, patients: 0 };
            groupedByDate[date].income += c.payment?.total || 0;
            groupedByDate[date].patients += 1;
          });

          const chartDataArr = Object.entries(groupedByDate)
            .map(([date, val]) => ({ date, income: val.income, patients: val.patients }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          // --- Find top day ---
          const topDay = chartDataArr.reduce(
            (prev, curr) => (curr.income > (prev?.income || 0) ? curr : prev),
            null
          );

          setSummary({
            totalIncome,
            totalPatients,
            avgIncomePerPatient,
            topDay,
          });

          setChartData(chartDataArr);
        }
      } catch (err) {
        console.error(err);
        errorToast(err.message || "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [branchId]);

  if (loading) return <p>Loading analytics...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-sm text-gray-500">Total Income</h2>
          <p className="text-xl font-semibold">Rs. {summary.totalIncome}</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-sm text-gray-500">Total Patients</h2>
          <p className="text-xl font-semibold">{summary.totalPatients}</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-sm text-gray-500">Avg Income / Patient</h2>
          <p className="text-xl font-semibold">Rs. {summary.avgIncomePerPatient}</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="text-sm text-gray-500">Top Day</h2>
          <p className="text-xl font-semibold">
            {summary.topDay
              ? `${summary.topDay.date} (Rs. ${summary.topDay.income})`
              : "-"}
          </p>
        </div>
      </div>

      {/* Income Chart */}
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        <h2 className="text-lg font-semibold mb-4">Income over time</h2>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>No data available for chart</p>
        )}
      </div>
    </div>
  );
}
