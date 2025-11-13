import React, { useState, useContext, useEffect } from "react";
import { LabContext } from "../../context/LabContext";
import axios from "axios";
import Loader from "../../components/Loader";

const Interpretations = () => {
  const { adminToken, errorToast, branchToken, navigate } = useContext(LabContext);

  const [activeTab, setActiveTab] = useState("tests");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [interpretations, setInterpretations] = useState({ tests: [], panels: [] });

  const [modalContent, setModalContent] = useState(null); // for view all modal

  useEffect(() => {
    const fetchInterpretations = async () => {
      try {
        setLoading(true);

        const token = adminToken || branchToken;

const testsUrl = adminToken
  ? `${import.meta.env.VITE_API_URL}/api/test/database/admin/list`
  : `${import.meta.env.VITE_API_URL}/api/test/database/list`;

const panelsUrl = adminToken
  ? `${import.meta.env.VITE_API_URL}/api/test/panels/admin/list`
  : `${import.meta.env.VITE_API_URL}/api/test/panels/list`;

const testsRes = await axios.get(testsUrl, {
  headers: { Authorization: `Bearer ${token}` },
});

const panelsRes = await axios.get(panelsUrl, {
  headers: { Authorization: `Bearer ${token}` },
});


        setInterpretations({
          tests: (testsRes.data.tests || []).filter(t => t.interpretation && t.interpretation.trim() !== ""),
          panels: (panelsRes.data.panels || []).filter(p => p.interpretation && p.interpretation.trim() !== ""),
        });
      } catch (err) {
        console.error("Error fetching interpretations:", err);
        errorToast(err.response?.data?.message || "Failed to fetch interpretations.");
      } finally {
        setLoading(false);
      }
    };

    fetchInterpretations();
  }, [adminToken]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredInterpretations = interpretations[activeTab].filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Extract first line from HTML interpretation
  const getFirstLine = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || "";
    return text.split("\n")[0].split(".")[0] + "."; // first sentence
  };

  if (loading) return <Loader />;

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg mt-6">
      <h1 className="text-2xl font-semibold mb-4">Interpretations</h1>

      

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          <span className="text-green-500">✔</span> To edit the interpretation, go to the{" "}
          <span onClick={()=> navigate('admin/test-database')} className="text-blue-500 cursor-pointer">Test Database{" "}</span>
          <span className="">and click Edit on the test.</span>
        </div>
        <div className="text-sm">Panels: {interpretations.panels.length}</div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-4">
          <button
            className={`py-2 px-4 font-semibold ${
              activeTab === "tests" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("tests")}
          >
            Tests
          </button>
          <button
            className={`py-2 px-4 font-semibold ${
              activeTab === "panels" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("panels")}
          >
            Panels
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center mb-4 mt-4">
        <input
          type="text"
          placeholder="Search in page"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-1/3 p-2 border border-gray-300 rounded-md"
        />
        {adminToken && (
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            + Add new
          </button>
        )}
      </div>

      {/* Table */}
      <table className="w-full border-collapse overflow-x-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-b p-2 text-left">S. No.</th>
            <th className="border-b p-2 text-left">NAME</th>
            <th className="border-b p-2 text-left">INTERPRETATION</th>
            {adminToken && <th className="border-b p-2 text-left">ACTION</th>}
          </tr>
        </thead>
        <tbody>
          {filteredInterpretations.map((item, index) => (
            <tr key={item._id || item.id} className="border-b hover:bg-gray-50">
              <td className="p-2">{index + 1}</td>
              <td className="p-2">{item.name}</td>
              <td className="p-2">{getFirstLine(item.interpretation)}</td>
              {adminToken && (
                <td className="p-2">
                  <div className="flex items-center gap-3">
                    <button
                      className="text-blue-500 hover:underline whitespace-nowrap"
                      onClick={() => setModalContent(item.interpretation)}
                    >
                      View full
                    </button>
                    
                  </div>
                </td>
              )}
            </tr>
          ))}
          {filteredInterpretations.length === 0 && (
            <tr>
              <td colSpan={adminToken ? "4" : "3"} className="text-center py-4 text-gray-500">
                No {activeTab} found with interpretation.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {modalContent && (
        <div className="fixed inset-0  bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-xl w-full relative">
            <h2 className="text-xl font-semibold mb-4">Full Interpretation</h2>
            <div dangerouslySetInnerHTML={{ __html: modalContent }} className="mb-4" />
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold"
              onClick={() => setModalContent(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interpretations;

