import React, { useRef, useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

// Number to words helper
function numberToWords(num) {
  const a = ["","one","two","three","four","five","six","seven","eight","nine","ten",
    "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const b = ["","", "twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  if((num=num.toString()).length>9) return "overflow";
  const n=("000000000"+num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if(!n) return;
  let str = "";
  str += n[1]!=0? (a[Number(n[1])] || b[n[1][0]]+" "+a[n[1][1]])+" crore ":"";
  str += n[2]!=0? (a[Number(n[2])] || b[n[2][0]]+" "+a[n[2][1]])+" lakh ":"";
  str += n[3]!=0? (a[Number(n[3])] || b[n[3][0]]+" "+a[n[3][1]])+" thousand ":"";
  str += n[4]!=0? (a[Number(n[4])] || b[n[4][0]]+" "+a[n[4][1]])+" hundred ":"";
  str += n[5]!=0? ((str!=""?"and ":"") + (a[Number(n[5])] || b[n[5][0]]+" "+a[n[5][1]])+" ") :"";
  return str.trim()+" rupees only";
}

export default function BillPage() {
  const { reportId } = useParams();
  const { errorToast, navigate, adminToken } = useContext(LabContext);

  const [caseData, setCaseData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchData, setBranchData] = useState(null);
  const [testDetails, setTestDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Bill_${caseData?.regNo || reportId}`,
  });

  // ---------------- Fetch all branches ----------------
  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/branch/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setBranches(res.data.branches || []);
    } catch (err) {
      console.error(err);
      errorToast("Failed to load branches", "error");
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  // ---------------- Extract ID safely ----------------
  const extractId = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    if (item._id) return item._id.toString();
    if (item.testId) return item.testId.toString();
    return null;
  };

  // ---------------- Fetch item details ----------------
  const fetchItemDetails = async (id) => {
    const safeId = extractId(id);
    if (!safeId) return null;

    try {
      const resTest = await axios.get(`${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${safeId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (resTest.data.success && resTest.data.data)
        return { type: "TEST", name: resTest.data.data.name, categoryName: resTest.data.data.category, price: resTest.data.data.price || 0 };
    } catch {}

    try {
      const resPanel = await axios.get(`${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${safeId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (resPanel.data.success && resPanel.data.data)
        return { type: "PANEL", name: resPanel.data.data.name, categoryName: resPanel.data.data.category, price: resPanel.data.data.price || 0 };
    } catch {}

    try {
      const resPackage = await axios.get(`${import.meta.env.VITE_API_URL}/api/test/packages/admin/package/${safeId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (resPackage.data.success && resPackage.data.data)
        return { type: "PACKAGE", name: resPackage.data.data.name, categoryName: "Package", price: resPackage.data.data.fee || 0 };
    } catch {}

    return null;
  };

  // ---------------- Fetch case and items ----------------
  useEffect(() => {
    if (!reportId || branches.length === 0) return;

    const fetchCaseAndItems = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch case
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/cases/admin/${reportId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        if (!res.data.success) throw new Error(res.data.message || "Failed to fetch case");

        const caseInfo = res.data.data;
        setCaseData(caseInfo);

        // 2️⃣ Find branch from branches array using branchId from case
        const branch = branches.find(b => b._id === caseInfo.branchId);
        setBranchData(branch || null);

        // 3️⃣ Fetch all items (LAB, PANELS, PACKAGES)
        const allIds = [
          ...(caseInfo.tests?.LAB || []),
          ...(caseInfo.tests?.PANELS || []),
          ...(caseInfo.tests?.PACKAGES || []),
        ];
        const items = await Promise.all(allIds.map(fetchItemDetails));
        setTestDetails(items.flat().filter(Boolean));

      } catch (err) {
        console.error(err);
        errorToast(err.message || "Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchCaseAndItems();
  }, [reportId, branches]);

  if (loading || !caseData) return <Loader />;

  const c = caseData;
  const lab = branchData;
  const total = c.payment?.total || 0;
  const paid = c.payment?.received || 0;
  const mode = c.payment?.mode || "cash";
  const amountWords = numberToWords(paid);

  return (
    <>
      {/* Print-specific CSS */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printableBill, #printableBill * { visibility: visible; }
            #printableBill { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 210mm; 
              min-height: 297mm; 
              padding: 20mm; 
              box-sizing: border-box; 
              overflow: hidden;
            }
          }
        `}
      </style>

      <div className="flex flex-col lg:flex-row gap-6 max-w-8xl mx-auto p-4">
        {/* ---------------- Bill Section ---------------- */}
        <div ref={printRef} id="printableBill" className="w-full lg:w-1/2 bg-white border rounded-lg shadow p-6 text-sm">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-2">
            <div className="flex items-center gap-3">
              <img src={lab?.logo ? `/logos/${lab.logo}` : '/sanjay.png'} alt="Lab Logo" className="h-20 w-auto mb-2"/>
              <div className="mt-2">
                <h2 className="text-2xl font-semibold">{lab?.name || "Lab Name"}</h2>
                
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-xs mt-8">{lab?.address || "-"}</p>
              <p className="text-gray-600 text-xs">Phone: {lab?.contact || "-"}</p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="flex justify-between mt-4 text-[13px] leading-relaxed">
            <div>
              <p><strong>Name:</strong> {c.patient.firstName} {c.patient.lastName}</p>
              <p><strong>UHID:</strong> {c.patient.uhid || "-"}</p>
              <p><strong>Age / Sex:</strong> {c.patient.age} YRS / {c.patient.sex}</p>
              <p><strong>Referred by:</strong> {c.patient.doctor || "SELF"}</p>
              <p><strong>Received by:</strong> {lab?.name || "Lab Name"}</p>
            </div>
            <div>
              <p><strong>Mobile:</strong> {c.patient.mobile}</p>
              <p>
                <strong>Date:</strong> {new Date(c.createdAt).toLocaleString("en-GB")}
                <div className="mt-1">
                  <Barcode value={c.regNo} height={30} width={1.2} fontSize={10} margin={0} />
                </div>
              </p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full mt-4 border text-[13px] border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 w-8 text-left">S.No.</th>
                <th className="border px-2 py-1 text-left">Department</th>
                <th className="border px-2 py-1 text-left">Investigations</th>
                <th className="border px-2 py-1 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {testDetails.map((t, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{i + 1}</td>
                  <td className="border px-2 py-1">{t.categoryName}</td>
                  <td className="border px-2 py-1">{t.name}</td>
                  <td className="border px-2 py-1 text-right">Rs.{t.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="text-[13px] mt-4 space-y-1">
            <p className="text-right"><strong>Total Amount:</strong> Rs.{total}</p>
            <p className="text-right"><strong>Amount Paid:</strong> Rs.{paid}</p>
            <p><strong>Amount Paid (in words):</strong> {amountWords}</p>
          </div>

          {/* Signature */}
          <div className="text-center mt-10 text-xs">
            <p>Cashier's signature</p>
            <p className="mt-4">~~~ Thank You ~~~</p>
          </div>
        </div>

        {/* ---------------- Side Info (Screen only) ---------------- */}
        <div className="w-full lg:w-1/3 space-y-4 print:hidden">
          <div className="border rounded-lg bg-white p-4 shadow">
            <h3 className="font-semibold mb-2">Transaction History</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Time</th>
                  <th className="border px-2 py-1">Amount</th>
                  <th className="border px-2 py-1">Received By</th>
                  <th className="border px-2 py-1">Mode</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1">{new Date(c.createdAt || c.date).toLocaleDateString("en-GB")}</td>
                  <td className="border px-2 py-1">{new Date(c.createdAt || c.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}</td>
                  <td className="border px-2 py-1 text-right text-green-500 border-black">+ Rs.{total}</td>
                  <td className="border px-2 py-1">SD Labs</td>
                  <td className="border px-2 py-1">{mode}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border rounded-lg bg-white p-4 shadow text-center">
            <p className="text-sm mb-2">Request a review from the patient</p>
            <button className="bg-green-600 text-white px-4 py-1 rounded-md text-sm">Ask review 💬</button>
          </div>

          <div className="flex justify-center gap-2 mt-3">
            <button onClick={()=> window.print()} className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm">🖨️ Print</button>
            <button onClick={handlePrint} className="border border-blue-600 text-blue-600 px-4 py-1 rounded-md text-sm">Print PDF</button>
            <button onClick={() => navigate(`/admin/view-report/${c._id}`)} className="bg-green-600 text-white px-4 py-1 rounded-md text-sm">📄 View Lab Report</button>
          </div>
        </div>
      </div>
    </>
  );
}
