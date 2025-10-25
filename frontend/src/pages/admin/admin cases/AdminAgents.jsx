import React, { useContext, useState } from 'react'
import { LabContext } from '../../../context/LabContext';

const AdminAgents = () => {
  const {agents} = useContext(LabContext)
    const [activeTab, setActiveTab] = useState("active");
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Sample collection agents</h1>
  
        {/* Info Section */}
        <div className="flex items-start gap-3 mb-6 text-gray-700">
          <div className="w-6 h-6 flex items-center justify-center rounded-full border">
            ?
          </div>
          <div className="text-sm">
            <p className="font-medium mb-1">How does this work?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You can add and edit agents from new case page.</li>
              <li>
                Agent name will be displayed on cases page and daily business page.
              </li>
              <li>
                You can filter cases by agent name on cases page.
              </li>
            </ul>
          </div>
        </div>
  
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b mb-4">
          <button
            className={`pb-2 ${
              activeTab === "active"
                ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("active")}
          >
            Active <span className="ml-1 px-2 py-0.5 bg-gray-200 rounded-full text-xs">6</span>
          </button>
          <button
            className={`pb-2 ${
              activeTab === "archived"
                ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("archived")}
          >
            Archived{" "}
            <span className="ml-1 px-2 py-0.5 bg-gray-200 rounded-full text-xs">0</span>
          </button>
        </div>
  
        {/* Table */}
        {activeTab === "active" && (
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border text-left">AGENT ID</th>
                  <th className="p-2 border text-left">NAME</th>
                  <th className="p-2 border text-left">REGISTERED ON</th>
                  <th className="p-2 border text-left">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{agent.id}</td>
                    <td className="p-2 border">{agent.name}</td>
                    <td className="p-2 border">{agent.registered}</td>
                    <td className="p-2 border">
                      <button className="text-blue-600 flex items-center gap-1">
                        📄 Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
  
        {activeTab === "archived" && (
          <div className="p-6 text-gray-500 text-sm">No archived agents.</div>
        )}
      </div>
    );
}

export default AdminAgents
