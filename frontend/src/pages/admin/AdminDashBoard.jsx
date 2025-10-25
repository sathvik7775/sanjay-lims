import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, IndianRupee, TrendingUp, Activity } from "lucide-react";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const AdminDashBoard = () => {
  const { adminToken, errorToast } = useContext(LabContext);

  const [branches, setBranches] = useState([]);
  const [cases, setCases] = useState([]);
  const [branchStats, setBranchStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#14b8a6"];

  const getColor = (revenue) => {
    if (revenue > 450000) return "#2563eb";
    if (revenue > 350000) return "#22c55e";
    if (revenue > 250000) return "#f59e0b";
    return "#ef4444";
  };

  const fetchLatLng = async (place) => {
    if (!place) return { lat: 12.9716, lng: 77.5946 };
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          place
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
    return { lat: 12.9716, lng: 77.5946 };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const branchRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/branch/list`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        const branchData = Array.isArray(branchRes.data?.branches)
          ? branchRes.data.branches
          : [];
        setBranches(branchData);

        const caseRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/cases/admin/list`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        const caseData = Array.isArray(caseRes.data?.data) ? caseRes.data.data : [];
        setCases(caseData);

        const stats = await Promise.all(
          branchData.map(async (b) => {
            const branchCases = caseData.filter((c) => {
              const caseBranchId =
                typeof c.branchId === "object" ? c.branchId?._id : c.branchId;
              return caseBranchId === b._id;
            });

            const revenue = branchCases.reduce(
              (sum, c) => sum + (c.payment?.total || 0),
              0
            );

            const { lat, lng } =
              b.lat && b.lng ? { lat: b.lat, lng: b.lng } : await fetchLatLng(b.place);

            return {
              id: b._id,
              name: b.name,
              city: b.place || "-",
              revenue,
              cases: branchCases.length,
              lat,
              lng,
            };
          })
        );
        setBranchStats(stats);
      } catch (err) {
        console.error(err);
        errorToast(err?.message || "Failed to fetch admin dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminToken]);

  if (loading) return <Loader/>;

  const totalRevenue = cases.reduce((sum, c) => sum + (c.payment?.total || 0), 0);
  const totalCases = cases.length;

  const monthlyRevenueMap = {};
  cases.forEach((c) => {
    const date = new Date(c.createdAt);
    const month = date.toLocaleString("default", { month: "short", year: "numeric" });
    if (!monthlyRevenueMap[month]) monthlyRevenueMap[month] = 0;
    monthlyRevenueMap[month] += c.payment?.total || 0;
  });
  const revenueData = Object.entries(monthlyRevenueMap)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => new Date(a.month) - new Date(b.month));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
        <Building2 className="w-6 h-6 text-blue-600" /> Dashboard Overview
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <h3 className="text-xl font-semibold text-gray-800">
              ₹{totalRevenue.toLocaleString()}
            </h3>
          </div>
          <IndianRupee className="w-8 h-8 text-green-600" />
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Cases</p>
            <h3 className="text-xl font-semibold text-gray-800">{totalCases.toLocaleString()}</h3>
          </div>
          <Activity className="w-8 h-8 text-purple-600" />
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Active Branches</p>
            <h3 className="text-xl font-semibold text-gray-800">{branchStats.length}</h3>
          </div>
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Growth</p>
            <h3 className="text-xl font-semibold text-green-600">+8.4%</h3>
          </div>
          <TrendingUp className="w-8 h-8 text-green-500" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg shadow-sm p-4 col-span-2">
          <h3 className="text-md font-semibold text-gray-700 mb-3">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7, fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4">
          <h3 className="text-md font-semibold text-gray-700 mb-3">Revenue by Branch</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={branchStats}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={false} // Remove labels on slices
              >
                {branchStats.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip /> {/* Only tooltip remains */}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch Table */}
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Branch Revenue Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2">Branch</th>
                <th className="text-left px-4 py-2">Revenue</th>
                <th className="text-left px-4 py-2">Cases</th>
              </tr>
            </thead>
            <tbody>
              {branchStats.map((b, i) => (
                <tr
                  key={b.id}
                  className={`border-t hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <td className="px-4 py-2">{b.name}</td>
                  <td className="px-4 py-2 font-medium text-green-600">
                    ₹{b.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{b.cases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Karnataka Map */}
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Branch Locations (Karnataka)</h3>
        <div className="h-[500px] w-full rounded-lg overflow-hidden">
          <MapContainer center={[14.5, 75.9]} zoom={7} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {branchStats.map((b) => (
              <CircleMarker
                key={b.id}
                center={[b.lat, b.lng]}
                radius={15}
                fillColor={getColor(b.revenue)}
                fillOpacity={0.8}
                color="#fff"
                weight={1}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{b.name}</strong>
                    <br />
                    {b.city}, Karnataka
                    <br />
                    <span className="text-green-600">₹{b.revenue.toLocaleString()}</span>
                    <br />
                    Cases: {b.cases}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
