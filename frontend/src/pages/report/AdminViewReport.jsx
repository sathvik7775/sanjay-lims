import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import { Phone, Smartphone, Mail, Globe } from "lucide-react";
import Loader from "../../components/Loader";
import Barcode from "react-barcode";


const savePrintedPDF = (reportId) => {
  localStorage.setItem(reportId, "printed");
};


const ViewReport = () => {
  const { branchToken, errorToast, navigate, adminToken  } = useContext(LabContext);
  const { reportId } = useParams();

  const [loading, setLoading] = useState(true);
  const [isPrinted, setIsPrinted] = useState(false);

  const [branchId, setBranchId] = useState(null)
  const [report, setReport] = useState(null);
  const [letterhead, setLetterhead] = useState(null);
  const [printSetting, setPrintSetting] = useState(null)
  const [signatures, setSignatures] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef();

   const [branches, setBranches] = useState([]);
    const [labDetails, setLabDetails] = useState(null);

    useEffect(() => {
  if (!reportId) return;

  const interval = setInterval(() => {
    const printed = localStorage.getItem(reportId);
    setIsPrinted(printed === "printed");
  }, 1000); // 🔄 check every 1 sec

  return () => clearInterval(interval); // cleanup when component unmounts
}, [reportId]);



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

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Fetch Report / Case
      const reportRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cases/admin/${reportId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      const branchId = reportRes.data?.data.branchId;
      setBranchId(branchId)

      if (!reportRes.data.success) {
        errorToast(reportRes.data.message || "Failed to fetch report case");
        return;
      }

      let reportData = reportRes.data.data;

      // 2️⃣ Fetch Results
      const resultsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/results/admin/report/${reportId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (resultsRes.data?.success && resultsRes.data?.data) {
        reportData = { ...reportData, ...resultsRes.data.data };
      }

      setReport(reportData);

      // 3️⃣ Fetch Letterhead
      const lhRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/report/letterhead/branch/${branchId}`
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
}, [reportId, adminToken, branchId, errorToast]);

// ---------------- Fetch or Generate PDF ----------------
useEffect(() => {
  let interval;

  const fetchPDF = async () => {
    try {
      const pdfRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/pdf/get/${reportId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (pdfRes.data?.success && pdfRes.data?.pdfUrl) {
        setPdfUrl(pdfRes.data.pdfUrl);
        console.log("📄 Existing PDF found:", pdfRes.data.pdfUrl);
      } else {
        console.log("❌ No PDF");
        setPdfUrl(null);
      }
    } catch (err) {
      console.warn("❌ Error fetching PDF:", err.message);
      setPdfUrl(null);
    }
  };

  if (reportId && branchId && adminToken) {
    // Run immediately
    fetchPDF();

    // 🔄 Poll every 5 seconds
    interval = setInterval(fetchPDF, 1000);
  }

  return () => clearInterval(interval);
}, [reportId, branchId, adminToken]);

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
        lab: labDetails,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (res.data?.success && res.data?.pdfUrl) {
      setPdfUrl(res.data.pdfUrl);
      console.log("✅ PDF generated successfully");
      errorToast("PDF generated successfully");
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
      if (!branchId || !adminToken) return;

      let printRes;
      try {
        // Try GET first
        printRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/print/${branchId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
      } catch (err) {
        // Fallback to POST if GET fails
        try {
          printRes = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/print/${branchId}`,
            {},
            { headers: { Authorization: `Bearer ${adminToken}` } }
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
  }, [branchId, adminToken]);

  // ------------------ Handle Print ------------------
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };


  const [openMenu, setOpenMenu] = useState(false);
  
    
  
  
    const menuRef = useRef(null);
    
    
      useEffect(() => {
        function handleClickOutside(event) {
          if (menuRef.current && !menuRef.current.contains(event.target)) {
            setOpenMenu(false);   // 🔥 Close menu
          }
        }
    
        document.addEventListener("mousedown", handleClickOutside);
    
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, []);
    
      const [showBar, setShowBar] = useState(true);
      const [lastScrollY, setLastScrollY] = useState(0);
    
      useEffect(() => {
        const handleScroll = () => {
          if (window.scrollY > lastScrollY) {
            // scrolling DOWN → hide
            setShowBar(false);
          } else {
            // scrolling UP → show
            setShowBar(true);
          }
          setLastScrollY(window.scrollY);
        };
    
        window.addEventListener("scroll", handleScroll);
    
        return () => window.removeEventListener("scroll", handleScroll);
      }, [lastScrollY]);

       const [open, setOpen] = useState(false);
      
        const handleWeb = () => {
          const msg = `Here is your report:\n${pdfUrl}`;
          window.open(
            `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`,
            "_blank"
          );
        };
      
        const handleApp = () => {
          const msg = `Here is your report:\n${pdfUrl}`;
          window.open(
            `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`,
            "_blank"
          );
        };
    
    

  


  if (loading) return <Loader />;
  if (!report) return <p className="p-6 text-gray-500">Report not found</p>;


  return (
    <div className="bg-white min-h-screen py-6">

      <div className="w-full print:hidden flex justify-between">

      <div className="mb-4 px-8 print:hidden">
        <h1 className="text-3xl font-semibold text-gray-800">Lab report</h1>

        <div className="mt-2 inline-flex items-center gap-3">

          {/* Reg No */}
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-xs font-medium">
            Reg no. {report.regNo} | {report.dcn}
          </span>



        </div>

        {/* Status */}
        <div className="mt-3">
        <p className="flex items-center gap-2">
  <span className="font-semibold">Status:</span>

  <span
    className={`px-3 py-1 rounded text-sm font-medium 
      ${report.status === "In Progress"
        ? "bg-red-500 text-white"
        : report.status === "Signed Off"
        ? "bg-green-500 text-white"
        : report.status === "Final"
        ? "bg-blue-500 text-white"
        : "bg-gray-400 text-white"
      }`}
  >
    {report.status || "—"}
  </span>

  {isPrinted && (
    <span className="px-3 py-1 rounded text-sm font-medium bg-green-500 text-white flex items-center gap-1">
      Printed
      <span className="font-bold">✓</span>
    </span>
  )}
</p>


      </div>
      </div>

      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 h-15 p-3 rounded-md shadow-sm text-sm">
  <p className="font-semibold">⚠️ Attention!</p>
  <p>
    Kindly note: If you have added, removed, or modified any tests in this case,
    please click <strong>Enter Results</strong> to update the results.
  </p>
</div>

</div>
      {/* Action Buttons */}
      <div
  className={`fixed bottom-0 left-[225px] right-0 
    bg-white border-t border-gray-300 shadow-lg z-50
    transition-transform duration-300 print:hidden
    ${showBar ? "translate-y-0" : "translate-y-full"}`}
>
  <div className="w-full max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-3">

    {/* ======================= PRINT PDF / SIGN OFF ======================= */}
    <div ref={menuRef} className="relative flex items-center">

      {/* SIGNED OFF → Show PRINT PDF */}
      {report.status === "Signed Off" && (
        <>
          <button
  onClick={() => {
  savePrintedPDF(reportId);  // ✅ SAVE HERE
  if (pdfUrl) window.open(pdfUrl.replace("?dl=0", "?dl=1"), "_blank");
}}

  disabled={!pdfUrl}
  className={`flex items-center gap-2 
    px-5 h-10 rounded-l-md shadow transition border-r border-white
    ${pdfUrl ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-400 text-white cursor-not-allowed"}`}
>
  {pdfUrl ? (
    <>
      <img src="/pdf-w.png" className="w-4 h-4" />
      <span className="font-medium">Print PDF</span>
    </>
  ) : (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  )}
</button>


          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 
              flex items-center justify-center rounded-r-md shadow transition"
          >
            <img src="/down-arrow-w.png" className="w-3 h-3 opacity-80" />
          </button>
        </>
      )}

      {/* NOT SIGNED OFF → Show SIGN OFF button */}
      {report.status !== "Signed Off" && (
        <>
          <button
            onClick={() =>
    navigate(`/admin/edit-result/${reportId}`, {
      state: { autoSignOff: true }
    })
  }
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
              px-5 h-10 rounded-l-md shadow transition border-r border-white"
          >
            <img src="/signature-w.png" className="w-4 h-4" />
            <span className="font-medium">Sign off</span>
          </button>

          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 
              flex items-center justify-center rounded-r-md shadow transition"
          >
            <img src="/down-arrow-w.png" className="w-3 h-3 opacity-80" />
          </button>
        </>
      )}

      {/* DROPDOWN */}
      {openMenu && (
        <div className="absolute right-0 bottom-12 w-48 bg-white rounded-md shadow-lg border border-gray-300">
  <div className="absolute -bottom-2 right-4 w-3 h-3 bg-white rotate-45 border-l border-b"></div>

  <ul className="py-2 text-sm">

    <li
      onClick={() => navigate(`/admin/bill/${reportId}`)}
      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex gap-2 items-center"
    >
      <img src="/eye.png" className="w-4 h-4" /> View bill
    </li>

    <li
      onClick={() => navigate(`/admin/edit-case/${reportId}`)}
      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex gap-2 items-center"
    >
      <img src="/edit.png" className="w-4 h-4" /> Modify case
    </li>

    {/* ⭐ NEW: Unapprove Button */}
    <li
      onClick={() =>
        navigate(`/admim/edit-result/${reportId}?autoFinal=true`)
      }
      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex gap-2 items-center"
    >
      ❌ Unapprove
    </li>

  </ul>
</div>

      )}
    </div>

    {/* ======================= SEND REPORT ======================= */}
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Main Button */}
      <button
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white
        px-6 h-10 rounded-md shadow transition"
      >
        <img src="/send.png" className="w-4 h-4" />
        <span>Send report</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 -top-20 w-48 bg-white shadow-lg rounded-md border z-20">
          <button
            onClick={handleWeb}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex gap-2 items-center"
          >
            💻 WhatsApp Web
          </button>

          <button
            onClick={handleApp}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex gap-2 items-center"
          >
            📱 WhatsApp App
          </button>
        </div>
      )}
    </div>

    {/* ======================= ENTER RESULTS ======================= */}
    <button
      onClick={() => navigate(`/admin/edit-result/${reportId}`)}
      className="flex items-center gap-2 border border-blue-500 text-blue-600 
        px-5 h-10 rounded-md hover:bg-blue-50 transition"
    >
      <img src="/edit-b.png" className="w-4 h-4" />
      <span className="font-medium">Enter results</span>
    </button>

    {/* ======================= BROWSER PRINT ======================= */}
    <div className="relative flex items-center">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 border border-gray-300 text-gray-700 
          px-5 h-10 rounded-l-md hover:bg-gray-100 transition mx-3"
      >
        <img src="/printer.png" className="w-4 h-4" />
        <span className="font-medium">Browser print</span>
      </button>

      

    {/* ======================= PRINT SETTINGS ======================= */}
    <button
      onClick={() => navigate(`/admin/print-settings/${reportId}`)}
      className="flex items-center gap-2 border border-blue-500 text-blue-600 
        px-5 h-10 rounded-md hover:bg-blue-50 transition"
    >
      <img src="/settings-b.png" className="w-4 h-4" />
      <span className="font-medium">Print settings</span>
    </button>

  </div>
</div>
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
          <div className="text-sm flex justify-between items-center">
          
            {/* ---- ROW 1 (3 items) ---- */}
            <div className="flex flex-col gap-4">
              <div className="">
                <p><strong>Patient:</strong> {patient.firstName} {patient.lastName}</p>
              </div>
          
              <div className="">
                <p><strong>Age/Sex:</strong> {patient.age} {patient.ageUnit || "Yrs"} / {patient.sex}</p>
              </div>
          
              <div className="">
                <p><strong>Referred By:</strong> {patient.doctor || "—"}</p>
              </div>
            </div>
          
            {/* ---- ROW 2 (3 items) ---- */}
            <div className="flex flex-col gap-4 ">
              <div className="">
                <p><strong>Date:</strong>
                  {new Date(report.createdAt).toLocaleDateString("en-GB")}, {new Date(report.createdAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
          
              <div className="">
                <p><strong>PAT ID:</strong> {patient.regNo}</p>
              </div>
          
              <div className="">
                <p><strong>UHID:</strong> {patient.uhid}</p>
              </div>
            </div>
          
            {/* ---- ROW 3 → BARCODE RIGHT ---- */}
            <div className="">
              <Barcode
                value={patient.regNo || ""}
                height={30}
                width={1.2}
                fontSize={12}
                margin={0}
                renderer="canvas"
                
              />
            </div>
          
          </div>
        </div>
      )}
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

             
              <div className="flex items-center mt-1">
  <Barcode
    value={patient.regNo || ""}
    height={30}
    width={1.1}
    fontSize={12}
    margin={0}
     
    renderer="canvas"
  />
</div>

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
