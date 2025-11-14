import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import { Phone, Smartphone, Mail, Globe } from "lucide-react";
import Loader from "../../components/Loader";
import Barcode from "react-barcode";

const ViewReport = () => {
  const { branchToken, errorToast, navigate, branchId, successToast } = useContext(LabContext);
  const { reportId } = useParams();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [letterhead, setLetterhead] = useState(null);
  const [printSetting, setPrintSetting] = useState(null)
  const [signatures, setSignatures] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef();

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Fetch Report / Case
      const reportRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cases/branch/${reportId}`,
        { headers: { Authorization: `Bearer ${branchToken}` } }
      );

      if (!reportRes.data.success) {
        errorToast(reportRes.data.message || "Failed to fetch report case");
        return;
      }

      let reportData = reportRes.data.data;

      // 2️⃣ Fetch Results
      const resultsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/results/report/${reportId}`,
        { headers: { Authorization: `Bearer ${branchToken}` } }
      );

      if (resultsRes.data?.success && resultsRes.data?.data) {
        reportData = { ...reportData, ...resultsRes.data.data };
      }

      setReport(reportData);

      // 3️⃣ Fetch Letterhead
      const lhRes = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/report/letterhead/branch/${branchId}`,
  {
    headers: {
      Authorization: `Bearer ${branchToken}`,
    },
  }
);

      const letterheadData = lhRes.data?.data || null;
      console.log(lhRes.data);
      
      
      setLetterhead(letterheadData);

      // 4️⃣ Fetch Signatures
      const sigRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/report/signature/branch/${branchId}`
      );
      const signatureData = sigRes.data?.data || [];
      setSignatures(signatureData);

     
     
    } catch (err) {
      console.error(err);
      errorToast("Failed to fetch report data or generate PDF");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [reportId, branchToken, branchId, errorToast]);

// ---------------- Fetch or Generate PDF ----------------
useEffect(() => {
  const fetchPDF = async () => {
    try {
      // 🟩 Step 1: Try fetching existing PDF
      const pdfRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/pdf/get/${reportId}`,
        { headers: { Authorization: `Bearer ${branchToken}` } }
      );

      if (pdfRes.data?.success && pdfRes.data?.pdfUrl) {
        setPdfUrl(pdfRes.data.pdfUrl);
        console.log("📄 Existing PDF found:", pdfRes.data.pdfUrl);
      } else {
        console.log("❌ No existing PDF found for this report");
        setPdfUrl(null);
      }
    } catch (err) {
      console.warn("❌ Error fetching PDF:", err.message);
      setPdfUrl(null);
    }
  };

  if (reportId && branchId && branchToken) {
    fetchPDF();
  }
}, [reportId, branchId, branchToken]);




const handleGeneratePDF = async () => {
  try {
    setLoading(true)
    if (!report || !letterhead || !signatures) {
      return errorToast("Missing report or letterhead data");
    }

    setIsPrinting(true);

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/pdf/add`,
      {
        reportId,
        branchId,
        reportData: report,
        patient: report.patient,
        letterhead: letterhead,
        signatures: signatures,
        printSetting,
      },
      { headers: { Authorization: `Bearer ${branchToken}` } }
    );

    if (res.data?.success && res.data?.pdfUrl) {
      setPdfUrl(res.data.pdfUrl);
      console.log("✅ PDF generated successfully");
      successToast("PDF generated successfully");
    } else {
      errorToast(res.data?.message || "Failed to generate PDF");
    }
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    errorToast("Failed to generate PDF");
    setLoading(false)
  } finally {
    setIsPrinting(false);
    setLoading(false)
  }
};




  useEffect(() => {
    const fetchPrintSetting = async () => {
      if (!branchId || !branchToken) return;

      let printRes;
      try {
        // Try GET first
        printRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/print/${branchId}`,
          { headers: { Authorization: `Bearer ${branchToken}` } }
        );
      } catch (err) {
        // Fallback to POST if GET fails
        try {
          printRes = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/print/${branchId}`,
            {},
            { headers: { Authorization: `Bearer ${branchToken}` } }
          );
        } catch (postErr) {
          console.error("Failed to fetch print settings:", postErr);
          return;
        }
      }

      

      // Set in state if available
      if (printRes?.data?.data) {
        setPrintSetting(printRes.data.data);
        console.log("Print setting fetched:", printRes.data.data);
      }
    };

    fetchPrintSetting();
  }, [branchId, branchToken]);

  // ------------------ Handle Print ------------------
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  console.log(letterhead);
  
  


  if (loading) return <Loader />;
  if (!report) return <p className="p-6 text-gray-500">Report not found</p>;


  return (
    <div className="bg-white min-h-screen py-6">
      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-6 print:hidden">
        <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-sm">
          Print Report
        </button>

        {pdfUrl ? (
    // ✅ If PDF exists → show Print PDF button
    <button
      onClick={() => window.open(pdfUrl.replace("?dl=0", "?dl=1"), "_blank")}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow-sm"
    >
      Print PDF
    </button>
  ) : (
    // ❌ If PDF not found → show Generate PDF button
    <button
      onClick={handleGeneratePDF}
      className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-md shadow-sm"
    >
      Generate PDF
    </button>
  )}




        <button
          onClick={() => navigate(`/${branchId}/edit-result/${reportId}`)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow-sm"
        >
          Edit Results
        </button>

        <button
          onClick={() => navigate(`/${branchId}/print-settings/${reportId}`)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md shadow-sm"
        >
          Print Settings
        </button>

        
      </div>

      {/* Web-Friendly Report */}
      <div className="block print:hidden">
        <WebReport report={report} printSetting={printSetting} signatures={signatures} />
      </div>

      {/* Print Preview */}
      <div ref={printRef} className={`${isPrinting ? 'block' : 'hidden'} print:block`}>
        <LetterheadTable
  lh={letterhead}
  signatures={signatures}
  patient={report.patient}
  report={report}
  printSetting={printSetting}
  style={{
    fontFamily: printSetting?.design?.fontFamily || "Inter",
    fontSize: `${printSetting?.design?.fontSize || 12}px`,
    lineHeight: printSetting?.design?.spacing || 1.2,
  }}
>
  {report.categories?.map((category, idx) => (
    <CategorySection key={idx} category={category} printSetting={printSetting}  />
  ))}
</LetterheadTable>

      </div>
    </div>
  );
};

// ---------------- Web-Friendly Report ----------------
const WebReport = ({ report, printSetting, signatures }) => {
  const { patient, categories } = report;
  return (
    <div className="bg-white p-4">
      {patient && (
        <div className="border border-gray-300 p-4 rounded-md mb-6 bg-gray-50 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <p><strong>Patient:</strong> {patient.firstName} {patient.lastName}</p>
            <p><strong>Age/Sex:</strong> {patient.age} {patient.ageUnit || "Yrs"} / {patient.sex}</p>
            <p><strong>Referred By:</strong> {patient.doctor || "—"}</p>
            <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString("en-GB")} <br />
              {new Date(report.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
            <p><strong>PAT ID:</strong> {patient.regNo}</p>
            <p><strong>UHID:</strong> {patient.uhid}</p>
          </div>
        </div>
      )}

      <div>
        <p className="flex items-center gap-2">
  <span className="font-semibold">Status:</span>
  <span
    className={`px-3 py-1 rounded-full text-sm font-medium border
      ${report.status === "In Progress"
        ? "bg-red-50 text-red-600 border-red-400"
        : report.status === "Signed Off"
        ? "bg-green-50 text-green-600 border-green-400"
        : report.status === "Final"
        ? "bg-blue-50 text-blue-600 border-blue-400"
        : "bg-gray-100 text-gray-600 border-gray-300"
      }`}
  >
    {report.status || "—"}
  </span>
</p>

      </div>
      <div className="space-y-6">
        {categories?.map((category, idx) => <CategorySection key={idx} category={category} printSetting={printSetting} />)}
      </div>

      {report.status === "Signed Off" && (
          <div className="flex flex-wrap justify-between w-full"
           style={{ minHeight: `${printSetting?.letterhead?.signatureHeight || 3.4}rem` }}>
            {signatures.map((sig, idx) => (
              <div key={idx} className="text-center mx-2 mb-3">
                {sig.imageUrl && <img src={sig.imageUrl} alt={sig.name} className="w-32 h-16 object-contain mx-auto" />}
                <p className="font-semibold text-xs mt-1">{sig.name}</p>
                {sig.designation && <p className="text-[11px] text-gray-600">{sig.designation}</p>}
              </div>
            ))}
          </div>
      )}

      
    </div>
  );
};

// Define the helper function at the top of your file (before LetterheadTable)
const calculateTAT = (createdAt, updatedAt) => {
  if (!createdAt || !updatedAt) return "-";

  const created = new Date(createdAt);
  const updated = new Date(updatedAt);

  const diffMs = updated - created; // difference in milliseconds
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffHours}h ${diffMinutes}m`;
};





// ---------------- Letterhead Table ----------------
const LetterheadTable = ({ lh, signatures, children, patient, report, printSetting }) => (
  <table className="report w-full min-h-[297mm] border-collapse">
    <thead>
      <tr>
        <th className=" bg-white border-b border-gray-300 -mt-2">
          <div
  className="flex justify-center items-center "
  style={{ minHeight: `${printSetting?.letterhead?.headerHeight || 4}rem` }}
>
  {lh?.headerImage && (
    <img
      src={lh.headerImage}
      alt="Header"
      className="w-full object-contain"
      style={{ height: `${lh?.headerHeight || 100}px` }}
    />
  )}
</div>


          {patient && (
            <div className="mt-6 border border-black p-2 m-3 bg-white text-[10px] flex justify-between items-center">
              <div className="flex flex-col">
                <p className="font-semibold"
                style={{ fontSize: `${printSetting?.design?.fontSize || 12}px` }}>Patient: {patient.firstName} {patient.lastName}</p>
                <p className="font-semibold"
                style={{ fontSize: `${printSetting?.design?.fontSize || 12}px` }}>Age/Sex: {patient.age} {patient.ageUnit || "Yrs"} / {patient.sex}</p>
                <p className="font-semibold"
                style={{ fontSize: `${printSetting?.design?.fontSize || 12}px` }}>Referred By: {patient.doctor || "—"}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold"
                style={{ fontSize: `${printSetting?.design?.fontSize || 12}px` }}>Date: {new Date(report.createdAt).toLocaleDateString("en-GB")}</p>
                <p className="font-semibold"
                style={{ fontSize: `${printSetting?.design?.fontSize || 12}px` }}>Time: {new Date(report.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
                <p className="font-semibold"
                style={{ fontSize: `${printSetting?.design?.fontSize || 12}px` }}>PAT ID: {patient.regNo}</p>
                <p className="font-semibold"
                style={{ fontSize: `${printSetting?.design?.fontSize || 12}px` }}>UHID: {patient.uhid}</p>
              </div>

              {printSetting?.showHide?.showQRCode && (
              <div>
                <Barcode value={patient.regNo} height={20} width={1.2} fontSize={10} margin={0} />
              </div>
              )}
              {printSetting?.showHide?.showTATTime && (
  <p className="font-semibold">
    TAT: {calculateTAT(patient.createdAt, report.updatedAt)}
  </p>
)}

            </div>
          )}
        </th>
      </tr>

      
    </thead>

    <tbody>
      <tr><td className="p-4">{children}</td></tr>
    </tbody>

    <tfoot>
      <tr>
        <td className=" border-t border-gray-300">
          <div className="flex flex-wrap justify-between w-full"
           style={{ minHeight: `${printSetting?.letterhead?.signatureHeight || 3.4}rem` }}>
            {signatures.map((sig, idx) => (
              <div key={idx} className="text-center mx-2 mb-3">
                {sig.imageUrl && <img src={sig.imageUrl} alt={sig.name} className="w-32 h-16 object-contain mx-auto" />}
                <p className="font-semibold text-xs mt-1">{sig.name}</p>
                {sig.designation && <p className="text-[11px] text-gray-600">{sig.designation}</p>}
              </div>
            ))}
          </div>

          <div
  className="flex justify-center items-center "
  style={{ minHeight: `${printSetting?.letterhead?.footerHeight || 3.3}rem` }}
>
  {lh?.footerImage && (
    <img
      src={lh.footerImage}
      alt="Footer"
      className="w-full object-contain"
      style={{ height: `${lh?.footerHeight || 80}px` }}
    />
  )}
</div>

        </td>
      </tr>
    </tfoot>
  </table>
);

// ---------------- Category Section ----------------
// ---------------- Category Section ----------------
const CategorySection = ({ category, printSetting }) => {
  const { capitalizeTests, categoryNewPage, useNABLFormat } = printSetting?.general || {};
  const { fontSize } = printSetting?.design || {};
  const categoryStyle = categoryNewPage ? { pageBreakBefore: "always" } : {};

  return (
    <div style={categoryStyle} className="mb-4 w-full">
      <div
        className={`text-center font-bold ${capitalizeTests ? "uppercase" : ""} mb-2`}
      >
        {useNABLFormat ? `**${category.categoryName}**` : category.categoryName}
      </div>

      <table
        className="w-full border-collapse table-fixed"
        style={{ fontSize: `${fontSize || 12}px` }}
      >
        <thead>
          <tr className="border-t border-b border-black">
            <th className="text-left py-1 px-2 w-[40%] text-black">TEST</th>
            <th className="text-left py-1 px-2 w-[20%] text-black">VALUE</th>
            <th className="text-left py-1 px-2 w-[20%] text-black">UNIT</th>
            <th className="text-left py-1 px-2 w-[20%] text-black">REFERENCE</th>
          </tr>
        </thead>

        <tbody>
          {category.items?.map((item, idx) =>
            item.isPanel || item.isPackage ? (
              <PanelPage key={idx} item={item} printSetting={printSetting} />
            ) : (
              <TestRow key={idx} test={item} printSetting={printSetting} />
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

// ---------------- Panel Page (Now uses same table layout) ----------------
const PanelPage = ({ item, printSetting }) => {
  const { fontSize } = printSetting?.design || {};

  return (
    <>
      {/* Panel Header Row inside table */}
      <tr className="w-full bg-gray-50">
  <td
    colSpan={4}
    className="py-2 px-2 text-center font-semibold text-gray-800"
    style={{
      fontSize: `${fontSize || 12}px`,
      textAlign: "center",
      verticalAlign: "middle",
      lineHeight: "1.5",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
      }}
    >
      {item.panelOrPackageName || item.testName}
    </div>
  </td>
</tr>


      {/* Render sub-tests inline (aligned to same columns) */}
      {item.tests?.map((test, idx) =>
        test.isPanel || test.isPackage ? (
          <PanelPage key={idx} item={test} printSetting={printSetting} />
        ) : (
          <TestRow key={idx} test={test} printSetting={printSetting} />
        )
      )}

      {/* Interpretation section (if exists) */}
      {item.interpretation && (
        <tr>
          <td
            colSpan={4}
            className="p-2 text-gray-700"
            style={{
              fontSize: `${fontSize || 12}px`,
              lineHeight: 1.4,
            }}
          >
            <strong>Interpretation:</strong>
            <div
              className="mt-1 ml-2"
              dangerouslySetInnerHTML={{ __html: item.interpretation }}
            />
          </td>
        </tr>
      )}
    </>
  );
};


// ---------------- Test Row (no change) ----------------
const TestRow = ({ test, printSetting }) => {
  const params = test.params || [];
  const groups = [...new Set(params.map((p) => p.groupBy || "Ungrouped"))];

  const { boldAbnormal, redAbnormal, fontSize } = printSetting?.design || {};
  const useHLMarkers = printSetting?.general?.useHLMarkers;

  const isOutOfRange = (value, reference) => {
    if (!value || !reference) return false;
    const rangeMatch = reference.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (!rangeMatch) return null;
    const [, min, max] = rangeMatch;
    const numValue = parseFloat(value);
    if (numValue < parseFloat(min)) return "low";
    if (numValue > parseFloat(max)) return "high";
    return false;
  };

  return (
    <>
      {groups.map((group) => {
        const groupParams = params.filter((p) => (p.groupBy || "Ungrouped") === group);

        return (
          <React.Fragment key={group}>

            {group &&
  group.length > 0 &&
  groups[0] === group &&
  params.length > 1 && (
    <tr>
      <td colSpan={4} className="px-2 font-semibold">
        {test.testName}
      </td>
    </tr>
)}



            {group  && (
              <tr>
                <td colSpan={4} className=" px-2 font-semibold ">
                  {group}
                </td>
              </tr>
            )}

            

            {groupParams.map((p) => {
              const hl = useHLMarkers ? isOutOfRange(p.value, p.reference) : false;
              const outOfRange = hl !== false;
              const style = {
                color: outOfRange && redAbnormal ? "red" : "black",
                fontWeight: outOfRange && boldAbnormal ? "bold" : "normal",
              };
              const marker = hl === "high" ? " ↑" : hl === "low" ? " ↓" : "";

              return (
                <tr key={p.paramId} className="">
                  <td className=" px-2 text-left w-[40%] break-words">{p.name}</td>
                  <td className=" px-2 text-left w-[20%]" style={style}>
                    {p.value || "-"}
                    {marker}
                  </td>
                  <td className=" px-2 text-left w-[20%]">{p.unit || "-"}</td>
                  <td className=" px-2 text-left w-[20%]">{p.reference || "-"}</td>
                </tr>
              );
            })}
          </React.Fragment>
        );
      })}

      {test.interpretation && (
        <tr>
          <td colSpan={4} className="p-2 text-gray-700">
            <strong>Interpretation:</strong>{" "}
            <span dangerouslySetInnerHTML={{ __html: test.interpretation }} />
          </td>
        </tr>
      )}
    </>
  );
};




export default ViewReport;
