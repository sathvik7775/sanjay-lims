import React, { useContext, useState } from "react";
import { LabContext } from "../../context/LabContext";
import { useNavigate } from "react-router-dom";

const RateList = () => {
  const { dummyTests, dummyPanels, packages, branchId, adminToken } = useContext(LabContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tests");

  const tests = dummyTests?.filter((t) => t.addToRateList) || [];
  const panels = dummyPanels?.filter((p) => p.addToRateList) || [];
const filteredPackages = packages?.filter((pkg) => pkg.addToRateList) || [];


  const renderTable = () => {
    if (activeTab === "tests") {
      return (
        <div className="overflow-x-auto border border-gray-400 rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border border-gray-400 px-3 py-2 w-16">#</th>
                <th className="border border-gray-400 px-3 py-2 text-left">NAME</th>
                <th className="border border-gray-400 px-3 py-2 text-left">CATEGORY</th>
                <th className="border border-gray-400 px-3 py-2 text-right">PRICE</th>
                <th className="border border-gray-400 px-3 py-2 text-center w-32">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tests.length > 0 ? (
                tests.map((test, index) => (
                  <tr key={test._id} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-3 py-2">{index + 1}</td>
                    <td className="border border-gray-400 px-3 py-2">{test.name}</td>
                    <td className="border border-gray-400 px-3 py-2">{test.category || "—"}</td>
                    <td className="border border-gray-400 px-3 py-2 text-right">₹{test.price || 0}</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">
                      {adminToken ? (<button
                        onClick={() => navigate(`/admin/test-view/${test._id}`)}
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </button>
                      ): (
                        <button
                        onClick={() => navigate(`/${branchId}/test-view-branch/${test._id}`)}
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </button>
                      )}
                      
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No tests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "panels") {
      return (
        <div className="overflow-x-auto border border-gray-400 rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border border-gray-400 px-3 py-2 w-16">#</th>
                <th className="border border-gray-400 px-3 py-2 text-left">NAME</th>
                <th className="border border-gray-400 px-3 py-2 text-left">CATEGORY</th>
                <th className="border border-gray-400 px-3 py-2 text-left">TESTS</th>
                <th className="border border-gray-400 px-3 py-2 text-right">PRICE</th>
                <th className="border border-gray-400 px-3 py-2 text-center w-32">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {panels.length > 0 ? (
                panels.map((panel, index) => (
                  <tr key={panel._id} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-3 py-2">{index + 1}</td>
                    <td className="border border-gray-400 px-3 py-2">{panel.name}</td>
                    <td className="border border-gray-400 px-3 py-2">{panel.category || "—"}</td>
                    <td className="border border-gray-400 px-3 py-2">
                      {panel.tests?.length
                        ? panel.tests.map((t) => t.name).join(", ")
                        : "—"}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-right">₹{panel.price || 0}</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">

                        {adminToken ? (<button
                        onClick={() => navigate(`/admin/test-panels`)}
                        className="text-blue-500 hover:underline"
                      >
                        View all
                      </button>
                      ): (
                        <button
                        onClick={() => navigate(`/${branchId}/test-panels`)}
                        className="text-blue-500 hover:underline"
                      >
                        View all
                      </button>
                      )}
                      
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No panels found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "packages") {
      return (
        <div className="overflow-x-auto border border-gray-400 rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border border-gray-400 px-3 py-2 w-16">#</th>
                <th className="border border-gray-400 px-3 py-2 text-left">NAME</th>
                <th className="border border-gray-400 px-3 py-2 text-left">TESTS</th>
                <th className="border border-gray-400 px-3 py-2 text-left">PANELS</th>
                <th className="border border-gray-400 px-3 py-2 text-right">PRICE</th>
                <th className="border border-gray-400 px-3 py-2 text-center w-32">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length > 0 ? (
                filteredPackages.map((pkg, index) => (
                  <tr key={pkg._id} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-3 py-2">{index + 1}</td>
                    <td className="border border-gray-400 px-3 py-2">{pkg.name}</td>
                    <td className="border border-gray-400 px-3 py-2">
                      {pkg.tests?.length
                        ? pkg.tests.map((t) => t.name).join(", ")
                        : "—"}
                    </td>
                    <td className="border border-gray-400 px-3 py-2">
                      {pkg.panels?.length
                        ? pkg.panels.map((p) => p.name).join(", ")
                        : "—"}
                    </td>
                    <td className="border border-gray-400 px-3 py-2 text-right">₹{pkg.fee || 0}</td>
                    <td className="border border-gray-400 px-3 py-2 text-center">
                      {adminToken ? (<button
                        onClick={() => navigate(`/admin/test-packages`)}
                        className="text-blue-500 hover:underline"
                      >
                        View all
                      </button>
                      ): (
                        <button
                        onClick={() => navigate(`/${branchId}/test-packages`)}
                        className="text-blue-500 hover:underline"
                      >
                        View all
                      </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No packages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Rate List</h1>

      <div className="flex justify-center space-x-3 mb-6">
        {["tests", "panels", "packages"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-medium transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {renderTable()}
    </div>
  );
};

export default RateList;
