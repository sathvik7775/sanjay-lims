import React, { useContext, useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

export default function Agents() {
  const { adminToken, branchToken, errorToast, successToast } = useContext(LabContext);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [newAgent, setNewAgent] = useState({ name: "", phone: "", email: "" });

  // Fetch agents from backend
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const token = adminToken || branchToken;
      const endpoint = adminToken
        ? `${import.meta.env.VITE_API_URL}/api/agents/admin/list`
        : `${import.meta.env.VITE_API_URL}/api/agents/branch/list`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAgents(res.data.data.reverse());
      } else {
        errorToast(res.data.message || "Failed to fetch agents");
      }
    } catch (err) {
      console.error(err);
      errorToast("Error fetching agents");
    } finally {
      setLoading(false);
    }
  };

  // Add new agent
  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.name.trim()) return errorToast("Agent name is required");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/agents/add`,
        newAgent,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        successToast("Agent added successfully");
        setShowModal(false);
        setNewAgent({ name: "", phone: "", email: "" });
        fetchAgents();
      } else {
        errorToast(res.data.message || "Failed to add agent");
      }
    } catch (err) {
      console.error(err);
      errorToast("Error adding agent");
    }
  };

  // Delete agent
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/agents/delete/${id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        successToast("Agent deleted successfully");
        setAgents(agents.filter((a) => a._id !== id));
      } else {
        errorToast(res.data.message);
      }
    } catch (err) {
      console.error(err);
      errorToast("Failed to delete agent");
    }
  };

  // Toggle agent status (active ↔ archived)
  const handleStatusChange = async (id, currentStatus) => {
  try {
    // Convert lowercase status to backend expected casing
    const newStatus = currentStatus === "active" ? "Archived" : "Active";

    const res = await axios.patch(
      `${import.meta.env.VITE_API_URL}/api/agents/status/${id}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (res.data.success) {
      successToast(res.data.message);
      fetchAgents();
    } else {
      errorToast(res.data.message);
    }
  } catch (err) {
    console.error(err);
    errorToast("Failed to update agent status");
  }
};


  useEffect(() => {
    fetchAgents();
  }, []);

  if (loading) return <Loader />;

  const filteredAgents = agents.filter((a) => a.status.toLowerCase() === activeTab);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Sample Collection Agents</h1>
        {adminToken && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Agent
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 mb-6 text-gray-700">
        <div className="w-6 h-6 flex items-center justify-center rounded-full border">?</div>
        <div className="text-sm">
          <p className="font-medium mb-1">How does this work?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>You can add agents (Admin only).</li>
            <li>Agent names appear on cases page and daily business page.</li>
            <li>Filter cases by agent name on cases page.</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b mb-4">
        <button
          className={`pb-2 ${activeTab === "active" ? "border-b-2 border-blue-600 text-blue-600 font-medium" : "text-gray-600"}`}
          onClick={() => setActiveTab("active")}
        >
          Active <span className="ml-1 px-2 py-0.5 bg-gray-200 rounded-full text-xs">{agents.filter(a => a.status.toLowerCase() === "active").length}</span>
        </button>
        <button
          className={`pb-2 ${activeTab === "archived" ? "border-b-2 border-blue-600 text-blue-600 font-medium" : "text-gray-600"}`}
          onClick={() => setActiveTab("archived")}
        >
          Archived <span className="ml-1 px-2 py-0.5 bg-gray-200 rounded-full text-xs">{agents.filter(a => a.status.toLowerCase() === "archived").length}</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-md">
        {filteredAgents.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">No agents found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border text-left">#</th>
                <th className="p-2 border text-left">Registered On</th>
                <th className="p-2 border text-left">Name</th>
                <th className="p-2 border text-left">Phone</th>
                <th className="p-2 border text-left">Email</th>
                {adminToken && <th className="p-2 border text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent, i) => (
                <tr key={agent._id} className="hover:bg-gray-50 text-sm transition">
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border">{new Date(agent.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 border font-medium">{agent.name}</td>
                  <td className="p-2 border">{agent.phone || "—"}</td>
                  <td className="p-2 border">{agent.email || "—"}</td>
                  {adminToken && (
                    <td className="p-2 border flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(agent._id, agent.status.toLowerCase() === "active" ? "archived" : "active")}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {agent.status.toLowerCase() === "active" ? "📄 Archive" : "📄 Unarchive"}
                      </button>
                      <button
                        onClick={() => handleDelete(agent._id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Agent Modal */}
      {showModal && adminToken && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[90%] max-w-md p-6 relative shadow-lg">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Add New Agent</h2>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter agent name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={newAgent.phone}
                  onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter email"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
