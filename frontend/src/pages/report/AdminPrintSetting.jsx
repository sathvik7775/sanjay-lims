import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import Loader from "../../components/Loader";
import { Document, Page, pdfjs } from "react-pdf";
import { useRef } from "react";

// Set workerSrc for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// 🔹 Reusable Collapsible Section
const Section = ({ title, isOpen, onToggle, children }) => (
  <div className="border-b border-gray-300">
    <button
      onClick={onToggle}
      className="w-full flex justify-between items-center py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
    >
      <span>{title}</span>
      {isOpen ? <ChevronDown /> : <ChevronRight />}
    </button>
    {isOpen && <div className="p-4 space-y-3">{children}</div>}
  </div>
);

const AdminPrintSetting = () => {
  const { adminToken, errorToast, selectedBranch } = useContext(LabContext);
  const { reportId } = useParams();
  console.log(reportId);

 


  const [branchId, setBranchId] = useState(null);

  
  

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
const [letterhead, setLetterhead] = useState(null);
const [signatures, setSignatures] = useState([]);

const reportRef = useRef(null);
const patientRef = useRef(null);
const letterheadRef = useRef(null);
const signaturesRef = useRef(null);




  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [active, setActive] = useState("Letterhead");
  const [printSettings, setPrintSettings] = useState(null);

  const toggle = (tab) => setActive(active === tab ? null : tab);

  // ------------------ Fetch Print Settings ------------------
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const psRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/print/${branchId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        setPrintSettings(psRes.data.data);
      } catch (err) {
        console.error(err);
        errorToast("Failed to fetch print settings");
      }
    };
    fetchSettings();
  }, [branchId, adminToken, errorToast]);

  // ------------------ Fetch PDF by reportId ------------------
  useEffect(() => {
    const fetchPDF = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/pdf/get/${reportId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        
        
        if (res.data.success && res.data.pdfUrl) {
          setPdfUrl(res.data.pdfUrl);
        } else {
          errorToast(res.data.message || "Failed to fetch PDF");
        }
      } catch (err) {
        console.error(err);
        errorToast("Error fetching PDF");
      } finally {
        setLoading(false);
      }
    };
    fetchPDF();
  }, [reportId, adminToken, errorToast]);


 useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1) Case
      const caseRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cases/admin/${reportId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (!caseRes.data.success) return errorToast("Failed to fetch report case");

      const caseData = caseRes.data.data;
      const fetchedBranchId = caseData.branchId;
      setBranchId(fetchedBranchId);

      // 2) Results
      const resultsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/results/admin/report/${reportId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      const resultData = resultsRes.data.success ? resultsRes.data.data : {};

      // 3) Final report object
      const finalReportData = {
        ...caseData,
        ...resultData,
        createdAt: caseData.createdAt,
        updatedAt: resultData.updatedAt || caseData.updatedAt,
        categories: resultData.categories || caseData.categories || []
      };

      // Store to state + refs
      setReport(finalReportData);
      reportRef.current = finalReportData;
      patientRef.current = finalReportData.patient;

      // 4) Letterhead
      const lhRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/report/letterhead/branch/${fetchedBranchId}`
      );

      setLetterhead(lhRes.data?.data || null);
      letterheadRef.current = lhRes.data?.data || null;

      // 5) Signatures
      const sigRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/report/signature/branch/${fetchedBranchId}`
      );

      setSignatures(sigRes.data?.data || []);
      signaturesRef.current = sigRes.data?.data || [];

    } catch (err) {
      console.error(err);
      errorToast("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [reportId, adminToken]);




  // ------------------ Save Print Settings ------------------
 const handleSave = async () => {
  try {
    // 1️⃣ Save new settings to DB
    const saveRes = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/print/${branchId}`,
      printSettings,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (!saveRes.data.success) {
      return errorToast("Failed to update print settings");
    }

    // 2️⃣ Fetch updated settings again from DB
    const psRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/print/${branchId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const updatedSettings = psRes.data.data;
    setPrintSettings(updatedSettings);

    // 3️⃣ Send updated settings directly to preview API
    const previewRes = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/pdf/preview`,
      {
    reportData: reportRef.current,
    patient: patientRef.current,
    letterhead: letterheadRef.current,
    signatures: signaturesRef.current,
    printSetting: updatedSettings
  },
      { responseType: "arraybuffer" }
    );

    const blob = new Blob([previewRes.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    // 4️⃣ Update IFRAME
    setPdfUrl(url);

    alert("✅ Settings saved & preview updated!");

  } catch (err) {
    console.error(err);
    errorToast("Failed to update print settings");
  }
};

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-6 bg-gray-50 min-h-screen">
      {/* 🔧 LEFT: Settings Panel */}
      <div className="lg:w-1/3 bg-white rounded-xl shadow-md border h-fit">
        <div className="flex justify-between items-center border-b px-4 py-3 bg-gray-50">
          <h2 className="text-lg font-bold">🖨️ Print Settings</h2>
        </div>

        {printSettings && (
          <>
            {/* Letterhead Section */}
            <Section
              title="Letterhead"
              isOpen={active === "Letterhead"}
              onToggle={() => toggle("Letterhead")}
            >
              {Object.entries(printSettings.letterhead || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center">
                  <label className="capitalize text-gray-700">{key}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={val}
                    onChange={(e) =>
                      setPrintSettings({
                        ...printSettings,
                        letterhead: {
                          ...printSettings.letterhead,
                          [key]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="border rounded-md px-2 py-1 w-20 text-right"
                  />
                  <span className="text-gray-500 text-sm ml-2">cm</span>
                </div>
              ))}
            </Section>

            {/* Design Section */}
            <Section title="Design" isOpen={active === "Design"} onToggle={() => toggle("Design")}>
              {Object.entries(printSettings.design || {}).map(([key, val]) =>
                typeof val === "boolean" ? (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) =>
                        setPrintSettings({
                          ...printSettings,
                          design: { ...printSettings.design, [key]: e.target.checked },
                        })
                      }
                    />
                    <span>{key.replace(/([A-Z])/g, " $1")}</span>
                  </label>
                ) : (
                  <div key={key} className="flex justify-between items-center">
                    <label>{key}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setPrintSettings({
                          ...printSettings,
                          design: { ...printSettings.design, [key]: e.target.value },
                        })
                      }
                      className="border rounded-md px-2 py-1 w-28"
                    />
                  </div>
                )
              )}
            </Section>

            {/* General Section */}
            <Section title="General" isOpen={active === "General"} onToggle={() => toggle("General")}>
              {Object.entries(printSettings.general || {}).map(([key, val]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) =>
                      setPrintSettings({
                        ...printSettings,
                        general: { ...printSettings.general, [key]: e.target.checked },
                      })
                    }
                  />
                  <span>{key.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </Section>

            {/* Show / Hide Section */}
            <Section title="Show / Hide" isOpen={active === "ShowHide"} onToggle={() => toggle("ShowHide")}>
              {Object.entries(printSettings.showHide || {}).map(([key, val]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) =>
                      setPrintSettings({
                        ...printSettings,
                        showHide: { ...printSettings.showHide, [key]: e.target.checked },
                      })
                    }
                  />
                  <span>{key.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </Section>

            <div className="p-4 border-t text-right">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </>
        )}
      </div>

      {/* 🧾 RIGHT: PDF Viewer */}
      <div className="lg:w-2/3 bg-white border rounded-lg shadow-sm p-4 overflow-auto">
  {pdfUrl ? (
    <div className="flex justify-center py-4">
      <div
        style={{
          width: "80%",            // shrink the PDF width
          background: "#f8f8f8",   // light background
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)"
        }}
      >
        <iframe
          src={pdfUrl}
          title="Report PDF"
          style={{
            width: "100%",
            height: "900px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "white"
          }}
        />
      </div>
    </div>
  ) : (
    <p className="text-gray-500">PDF not available</p>
  )}
</div>


    </div>
  );
};

export default AdminPrintSetting;
