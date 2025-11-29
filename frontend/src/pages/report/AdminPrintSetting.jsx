import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import Loader from "../../components/Loader";
import { Document, Page, pdfjs } from "react-pdf";
import { useRef } from "react";

import PdfPreview from "./PdfPreview";

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
  const { adminToken, errorToast, selectedBranch, navigate } = useContext(LabContext);
  const { reportId } = useParams();
  

 


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


  const [branches, setBranches] = useState([]);
    const [labDetails, setLabDetails] = useState(null);


    const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await axios.get( `${import.meta.env.VITE_API_URL}/api/admin/branch/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      
      
      setBranches(res.data.branches || []);
    } catch (err) {
      errorToast("Failed to load branches", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchBranches();
}, []);


useEffect(() => {
  if (!branchId || branches.length === 0) return;

  const selected = branches.find(b => b._id === branchId);

  if (selected) {
    setLabDetails({
      name: selected.branchName,
      address: selected.address || selected.fullAddress || ""
    });
  }

}, [branchId, branches]);

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
          
        }
      } catch (err) {
        console.error(err);
        
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
      
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [reportId, adminToken]);




  // ------------------ Save Print Settings ------------------
 const handleSave = async () => {
  try {
    setLoading(true)
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
    printSetting: updatedSettings,
    lab: labDetails,
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
    setLoading(false)
    errorToast("Failed to update print settings");
  } finally{
    setLoading(false)
  }
};

const cardClass = "bg-white border border-gray-200 rounded-lg shadow-sm";
const infoCardClass = "bg-white border border-gray-300 rounded-lg shadow p-4";


  if (loading) return <Loader />;

  return (
  <div className="w-full min-h-screen bg-white">

    {/* TOP BAR */}
    <div className="flex items-center px-6 py-4 border-b bg-white shadow-sm">
      <button onClick={()=> navigate(-1)} className="mr-4 text-gray-600 hover:text-black text-xl">✖</button>
      <h1 className="text-[20px] font-semibold text-gray-800">Print settings</h1>
    </div>

    <div
  className="w-full bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-4"
>
  <p className="font-medium text-[15px]">
    ⚠ Please complete your Print Settings before generating the PDF report.
  </p>
</div>


    {/* MAIN 3 COLUMN GRID */}
    <div className="grid grid-cols-12 gap-6 p-6">

      {/* LEFT SIDEBAR SETTINGS */}
      <div className="col-span-3">
        <div className={`${cardClass} p-0`}>

          {/* Your existing Left Sections */}
          { /* Start sections */ }
          {printSettings && (
            <div className="divide-y divide-gray-200">

              {/* Letterhead */}
              <Section
                title="Letterhead"
                isOpen={active === "Letterhead"}
                onToggle={() => toggle("Letterhead")}
              >
                {/* with Letterhead Checkbox */}
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={printSettings?.withLetterhead ?? true}
                    onChange={(e) =>
                      setPrintSettings({
                        ...printSettings,
                        withLetterhead: e.target.checked,
                      })
                    }
                  />
                  <span className="font-medium">With letterhead</span>
                </label>

                {/* Set as Default */}
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={printSettings?.letterhead?.setAsDefault ?? true}
                    onChange={(e) =>
                      setPrintSettings({
                        ...printSettings,
                        letterhead: {
                          ...printSettings.letterhead,
                          setAsDefault: e.target.checked,
                        },
                      })
                    }
                  />
                  <span className="font-medium">Set as default</span>
                </label>

                {/* Heights */}
                {Object.entries(printSettings.letterhead || {}).map(([key, val]) => {
                  if (key === "setAsDefault") return null;

                  return (
                    <div key={key} className="flex justify-between items-center py-1">
                      <label className="text-gray-700 capitalize">{key}</label>
                      <div className="flex items-center gap-2">
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
                          className="border rounded-md px-2 py-1 w-20"
                        />
                        <span className="text-gray-500 text-sm">cm</span>
                      </div>
                    </div>
                  );
                })}
              </Section>

              {/* Design Section */}
            <Section
  title="Design"
  isOpen={active === "Design"}
  onToggle={() => toggle("Design")}
>
  {Object.entries(printSettings.design || {}).map(([key, val]) => {
    
    // 🔵 Use dropdown ONLY for fontFamily
    if (key === "fontFamily") {
      const supportedFonts = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Segoe UI",
  "Roboto",
  "Noto Sans",
  "Open Sans",
  "Lato",
  "Inter",
  "Nunito",
  "Poppins",
  "Montserrat",
  "Source Sans Pro",
  "Calibri",
  "Ubuntu",
  "PT Sans",
  "Work Sans",
  "Fira Sans",
  "Oxygen",
  "Exo 2",
  "Mulish",
  "Raleway",
  "DM Sans",
  "Times New Roman",
  "Times",
  "Georgia",
  "Noto Serif",
  "Merriweather",
  "PT Serif",
  "Libre Baskerville",
  "Courier New",
  "Courier",
  "Consolas",
  "Monaco",
  "Fira Mono"
];


      return (
        <div key={key} className="flex justify-between items-center">
          <label className="capitalize">{key}</label>

          <select
            value={val}
            onChange={(e) =>
              setPrintSettings({
                ...printSettings,
                design: { ...printSettings.design, [key]: e.target.value },
              })
            }
            className="border rounded-md px-2 py-1 w-40"
          >
            {supportedFonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // 🔵 Normal text/checkbox for everything else
    return typeof val === "boolean" ? (
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
    );
  })}
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

              <div className="p-4">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white w-full py-2 rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* CENTER PREVIEW COLUMN */}
      <div className="col-span-6">
        <div className={`${cardClass} p-4`}>

          {/* Header Row: Checkbox + PREVIEW label */}
          <div className="flex justify-between items-center mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={printSettings?.withLetterhead ?? true}
                onChange={(e) =>
                  setPrintSettings({
                    ...printSettings,
                    withLetterhead: e.target.checked,
                  })
                }
              />
              <span className="font-medium">With letterhead</span>
            </label>

            <span className="text-gray-500 font-medium uppercase tracking-wide">
              PREVIEW
            </span>
          </div>

          {/* PDF Preview Box */}
         <div className="flex justify-center">
  <div
    className="rounded-xl shadow bg-white"
    style={{
      width: "100%",
      maxWidth: "900px",
      height: "95vh",       // show full page height
      overflow: "hidden",   // hide overflow
    }}
  >
    {pdfUrl ? (
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <iframe
          src={`${pdfUrl}#zoom=page-fit&toolbar=0&navpanes=0`}
          title="Report PDF"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
    ) : (
      <p className="text-center text-gray-500">PDF not available</p>
    )}
  </div>
</div>





        </div>
      </div>

      {/* RIGHT INFO COLUMN */}
      <div className="col-span-3">

        <h2 className="text-[16px] font-semibold text-gray-800 mb-3">
          Important information
        </h2>

        <div className="space-y-4">

          <div className={infoCardClass}>
            <p className="text-gray-700 leading-relaxed">
              Please note down the settings before making any changes so that
              you can always restore the original settings.
            </p>
          </div>

          <div className={infoCardClass}>
            <p className="text-gray-700 leading-relaxed">
              You can get JPG from your printer or graphic designer & upload
              here. File size recommended: 100kb.
            </p>
          </div>

          <div className={infoCardClass}>
            <p className="text-gray-700 leading-relaxed">
              Use a centimeter scale to measure header and footer height.
            </p>
          </div>

          <div className={infoCardClass}>
            <p className="text-gray-700 leading-relaxed">
              A4 size is 21 cm × 29.7 cm. Uploaded image will be resized to
              1000px × 1414px. Max size allowed: 400kb.
            </p>
          </div>

        </div>
      </div>

    </div>
  </div>
);
};

export default AdminPrintSetting;









// const supportedFonts = [
//   "Arial",
//   "Helvetica",
//   "Verdana",
//   "Tahoma",
//   "Trebuchet MS",
//   "Segoe UI",
//   "Roboto",
//   "Noto Sans",
//   "Open Sans",
//   "Lato",
//   "Inter",
//   "Nunito",
//   "Poppins",
//   "Montserrat",
//   "Source Sans Pro",
//   "Calibri",
//   "Ubuntu",
//   "PT Sans",
//   "Work Sans",
//   "Fira Sans",
//   "Oxygen",
//   "Exo 2",
//   "Mulish",
//   "Raleway",
//   "DM Sans",
//   "Times New Roman",
//   "Times",
//   "Georgia",
//   "Noto Serif",
//   "Merriweather",
//   "PT Serif",
//   "Libre Baskerville",
//   "Courier New",
//   "Courier",
//   "Consolas",
//   "Monaco",
//   "Fira Mono"
// ];