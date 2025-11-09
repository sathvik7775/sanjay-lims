import React, { useContext, useEffect, useState } from "react";
import { Search } from "lucide-react";
import Select from "react-select";
import { LabContext } from "../context/LabContext";
import axios from "axios";

const NewCase = () => {
  const { doctors, agents, dummyTests, dummyPanels, branchId, branchToken, successToast, errorToast, packages, navigate } =
    useContext(LabContext);

    const [msgTemplates, setMsgTemplates] = useState([]); // fetched templates
const [selectedTemplates, setSelectedTemplates] = useState([]); // array of selected template IDs


useEffect(() => {
  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/whatsapp/get`, {
        
      });
      console.log(res.data);
      
      if (res.data.success) setMsgTemplates(res.data.data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };
  fetchTemplates();
}, []);





const handleTemplateToggle = (id) => {
  setSelectedTemplates((prev) =>
    prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
  );
};



  const [formData, setFormData] = useState({
    mobile: "",
    title: "",
    firstName: "",
    lastName: "",
    age: "",
    sex: "",
    uhid: "",
    doctor: "",
    agent: "",
    center: "Main",
    onlineReport: false,
    email: "",
    address: "",
    aadhaar: "",
    history: "",
  });

  const [payment, setPayment] = useState({
    total: 0,
    discount: 0,
    received: 0,
    mode: "cash",
    remarks: "",
    balance: 0,
  });

  const categories = [
    "LAB",
    "ECG",
    "TMT",
    "ECHO",
    "X - RAY",
    "USG",
    
    "OUTSOURCE LAB",
    "OTHER TESTS",
  ];

  const titleToGender = {
    "Mr.": "Male",
    "Ms.": "Female",
    "Mrs.": "Female",
    "Dr.": "other",

  };

  const [activeCategories, setActiveCategories] = useState([]);
  const [selectedTests, setSelectedTests] = useState({}); // only IDs now
  const [showFields, setShowFields] = useState({
    email: false,
    address: false,
    aadhaar: false,
    history: false,
  });

  // ---------------- Handlers ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "title") updated.sex = titleToGender[value] || "Other";
      return updated;
    });
  };

  const toggleField = (field) => setShowFields((prev) => ({ ...prev, [field]: !prev[field] }));
  const handleCategoryClick = (cat) =>
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  const updateBalance = (updatedPayment) => {
    const balance =
      (parseFloat(updatedPayment.total) || 0) -
      (parseFloat(updatedPayment.discount) || 0) -
      (parseFloat(updatedPayment.received) || 0) -
      (parseFloat(updatedPayment.collection) || 0);
    return { ...updatedPayment, balance };
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    setPayment((prev) => updateBalance({ ...prev, [name]: numValue }));
  };

  // ---------------- Select / Test handlers ----------------
const handleSelectChange = (cat, selectedOptions) => {
  // Only store IDs to match backend schema
  const selectedIds = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
  const updatedTests = { ...selectedTests, [cat]: selectedIds };
  setSelectedTests(updatedTests);

  // Recalculate total including packages
  const allSelectedTests = Object.values(updatedTests)
    .flat()
    .map(
      (id) =>
        dummyTests.find((t) => t._id === id) ||
        dummyPanels.find((p) => p._id === id) ||
        packages.find((pkg) => pkg._id === id)
    );

  const total = allSelectedTests.reduce(
    (sum, t) => sum + (t?.price || t?.fee || 0), // price for tests/panels, fee for packages
    0
  );

  setPayment((prev) => updateBalance({ ...prev, total }));
}; // <-- close handleSelectChange here

// ---------------- API Call ----------------
const handleCreateCase = async () => {
  try {
    const caseData = {
  branchId,
  patient: formData,
  tests: selectedTests,
  payment,
  categories: activeCategories,
  whatsappTriggers: selectedTemplates.map((id) => {
    const template = msgTemplates.find((t) => t._id === id);
    return {
      templateId: id,
      enabled: false,
      triggerType: template?.triggerType || "custom",
    };
  }),
};



    const config = {
      headers: { Authorization: `Bearer ${branchToken}`, "Content-Type": "application/json" },
    };

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/cases/branch/add`,
      caseData,
      config
    );

    if (response.data.success) {
      const newCase = response.data.data;
      successToast("Case created successfully!");
      
      navigate(`/${branchId}/enter-result/${newCase._id}`)
    } else {
      errorToast(response.data.message || "Failed to create case");
    }
  } catch (error) {
    console.error("Create Case Error:", error);
    errorToast(error.response?.data?.message || "Server error");
  }
};


  return (
    <div className="w-full mx-auto p-6 bg-white rounded-xl shadow">
      {/* PATIENT DETAILS */}
      <h2 className="text-xl font-semibold mb-4">Patient details</h2>

      {/* Mobile */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Mobile number{" "}
          <span className="text-gray-400">
            (Find existing patients by mobile)
          </span>
        </label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <span className="px-3 py-2 border-r bg-gray-50 text-gray-700 text-sm">
            +91
          </span>
          <input
            type="text"
            name="mobile"
            placeholder="Enter mobile number"
            value={formData.mobile}
            onChange={handleChange}
            className="flex-1 px-3 py-2 outline-none text-sm"
          />
          <button className="px-3 py-2 text-gray-500 hover:text-gray-700">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Name & Gender */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-7">
        <div className="flex gap-3 items-center">
          <div>
            <label className="block text-sm mb-1">Title*</label>
            <input
              list="titles"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-35 border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Select title..."
            />
            <datalist id="titles">
  {Object.keys(titleToGender).map((t) => (
    <option key={t} value={t} />
  ))}
</datalist>

          </div>

          <div>
            <label className="block text-sm mb-1">First name*</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Last name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Sex*</label>
          <div className="flex gap-4">
            {["Male", "Female", "Other"].map((s) => (
              <label key={s}>
                <input
                  type="radio"
                  name="sex"
                  value={s}
                  checked={formData.sex === s}
                  onChange={handleChange}
                  className="mr-1"
                />
                {s}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Age */}
      <div className="flex flex-col md:flex-row gap-4 mt-7">
        <div>
          <label className="block text-sm mb-1">Age*</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">TPA / Insurance</label>
          <input
            type="text"
            name="uhid"
            value={formData.uhid}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {/* Online report */}
      <div className="mt-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="onlineReport"
            checked={formData.onlineReport}
            onChange={handleChange}
          />
          Online report requested
        </label>
      </div>

      <div className="mb-4 mt-3">
  <p className="font-medium mb-2">WhatsApp Templates</p>
  <div className="flex  gap-3">
    {msgTemplates.map((t) => (
      <label key={t._id} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedTemplates.includes(t._id)}
          onChange={() => handleTemplateToggle(t._id)}
        />
        {t.title} ({t.triggerType}),
      </label>
    ))}
  </div>
</div>



      {/* Optional fields */}
      <div className="flex flex-wrap gap-4 mb-6 mt-6">
        {["email", "address", "aadhaar", "history"].map((field) => (
          <div key={field} className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleField(field)}
              className="px-4 py-1 text-sm border border-gray-300 rounded-full bg-gray-50 hover:bg-gray-100"
            >
              {showFields[field] ? `✖ ${field}` : `➕ ${field}`}
            </button>
            {showFields[field] &&
              (field === "history" ? (
                <textarea
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={`Enter ${field}`}
                  className="mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm w-52"
                />
              ) : (
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={`Enter ${field}`}
                  className="mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm w-52"
                />
              ))}
          </div>
        ))}
      </div>

      {/* Case Details */}
      <h2 className="text-xl font-semibold mb-4">Case details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div>
            <label className="block text-sm mb-1">Referred By*</label>
            <input
              list="doctors"
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Select doctor..."
            />
            <datalist id="doctors">
              {doctors.map((doc) => (
                <option key={doc._id} value={`${doc.name}`} />
              ))}
            </datalist>
          </div>
          <div className="px-2 py-1 rounded border border-blue-500 w-30 md:mt-6">
            <p className="text-blue-600 text-sm whitespace-nowrap cursor-pointer">+ Add new</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div>
            <label className="block text-sm mb-1">* Collection centre</label>
            <select
              name="center"
              value={formData.center}
              onChange={handleChange}
              className="w-40 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">-</option>
              <option value="Main">Main</option>
              <option value="Main">Home Visit</option>
              <option value="Main">Center Visit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Sample Collection Technician</label>
            <input
              list="agents"
              name="agent"
              value={formData.agent}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Select agent"
            />
            <datalist id="agents">
              {agents.map((item) => (
                <option key={item._id} value={`${item.name}`} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Category Buttons */}
<div className="flex flex-wrap gap-2 my-6">
  {categories.map((tab) => (
    <button
      key={tab}
      onClick={() => handleCategoryClick(tab)}
      className={`px-4 py-2 rounded-md font-medium transition ${
        activeCategories.includes(tab)
          ? "bg-blue-600 text-white"
          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
      }`}
    >
      {tab}
    </button>
  ))}
</div>

{/* Investigation Section with React Select */}
{/* Investigation Section with React Select */}
{/* Investigation Section with React Select */}
{activeCategories.map((cat) => {
  let filteredTests = [];

  // ✅ Filter tests by category type
  if (cat === "LAB") {
    filteredTests = dummyTests.filter((t) =>
      [
        "Haematology",
        "Biochemistry",
        "Serology & Immunology",
        "Clinical Pathology",
        "Endocrinology",
        "Microbiology",
        "Histopathology",
      ].includes(t.category)
    );
  } else if (cat === "ECG") {
  filteredTests = dummyTests.filter((t) => t.category === "Ecg");
} else if (cat === "TMT") {
  filteredTests = dummyTests.filter((t) => t.category === "tmt");
} else if (cat === "ECHO") {
  filteredTests = dummyTests.filter((t) => t.category === "Echo");
} else if (cat === "X - RAY") {
  filteredTests = dummyTests.filter((t) => t.category === "X - ray");
} else if (cat === "USG") {
  filteredTests = dummyTests.filter((t) => t.category === "USG");
} else if (cat === "OUTSOURCE LAB") {
  filteredTests = dummyTests.filter((t) => t.category === "Outsource Lab");
} else if (cat === "OTHER TESTS") {
  filteredTests = dummyTests.filter((t) => t.category === "Other");
} else {
  filteredTests = dummyTests.filter((t) => t.category === cat);
}


  // ✅ Combine both dummy tests and dummy panels together
  const combinedOptions = [
  // Tests
  ...filteredTests.map((test) => ({
    value: test._id,
    label: `🧪 ${test.name} (${test.shortName || test.short}) — ₹${test.price}`,
    type: "test",
  })),
  // Panels
  ...dummyPanels.map((panel) => ({
    value: panel._id,
    label: `📋 ${panel.name} (Panel) — ₹${panel.price}`,
    type: "panel",
  })),
  // Packages
  ...packages.map((pkg) => ({
    value: pkg._id,
    label: `📦 ${pkg.name} (Package) — ₹${pkg.fee}`,
    type: "package",
  })),
];

  // ✅ Get selected tests/panels for this category
  // ✅ Get selected tests/panels for this category
const selectedForCat = (selectedTests[cat] || []).map((id) => {
  return (
    dummyTests.find((t) => t._id === id) ||
    dummyPanels.find((p) => p._id === id) ||
    packages.find((pkg) => pkg._id === id)
  );
});


// ✅ Format selected values for react-select
const selectedOptions = selectedForCat.map((t) => ({
  value: t._id,
  label:
    t.type === "panel"
      ? `📋 ${t.name} (Panel) — ₹${t.price}`
      : t.type === "package"
      ? `📦 ${t.name} (Package) — ₹${t.fee}`
      : `🧪 ${t.name} (${t.shortName || t.short}) — ₹${t.price}`,
}));


  // ✅ Calculate subtotal for the category
  const categoryTotal = selectedForCat.reduce(
  (sum, t) => sum + (t.price || t.fee || 0),
  0
);


  return (
    <div key={cat} className="bg-white p-4 rounded-xl shadow-sm mb-6 border">
      <h2 className="font-semibold mb-2 text-gray-700">{cat} Investigations</h2>

      {/* ✅ Multiselect input now correctly displays selected tests */}
      <Select
        isMulti
        options={combinedOptions}
        value={selectedOptions}
        onChange={(selectedOptions) => handleSelectChange(cat, selectedOptions)}
        placeholder="Search and select multiple tests..."
        className="react-select-container mb-4"
        classNamePrefix="react-select"
      />

      {selectedForCat.length > 0 && (
        <div className="border-t pt-3 mt-3 text-sm">
          <p className="font-medium mb-2 text-gray-700">Selected Tests:</p>
          <ul className="list-disc ml-6 space-y-1 text-gray-600">
  {selectedForCat.map((test) => (
    <li key={test._id}>
      {test._id} — {test.name} ({test.shortName || test.short}) — ₹{test.price || test.fee}
    </li>
  ))}
</ul>


          {/* ✅ Category-specific subtotal */}
          <div className="mt-3 text-sm font-medium text-gray-700">
            Category Total: ₹{categoryTotal.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
})}




      {/* Payment Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h3 className="font-semibold mb-4 text-gray-700">Payment Details</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Total (Rs)", key: "total" },
            { label: "Discount", key: "discount" },
            { label: "Amount Received", key: "received" },
            
          ].map((item) => (
            <div key={item.key}>
              <label className="text-sm text-gray-600">{item.label}</label>
              <input
                type="number"
                 name={item.key}
                className="w-full border p-2 rounded-md"
                value={payment[item.key]}
                onChange={handlePaymentChange}
                  // setPayment({ ...payment, [item.key]: +e.target.value })
                disabled={item.key === "total"} 
              />
            </div>
          ))}

          <div>
            <label className="text-sm text-gray-600">Mode</label>
            <select
              className="w-full border p-2 rounded-md"
              value={payment.mode}
              onChange={(e) => setPayment({ ...payment, mode: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Remarks</label>
            <input
              type="text"
              className="w-full border p-2 rounded-md"
              placeholder="Any remarks..."
              value={payment.remarks}
              onChange={handlePaymentChange}
            />
          </div>
        </div>

        <div className="mt-4 text-red-600 font-semibold">
          Balance: ₹{payment.balance.toFixed(2)}
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={handleCreateCase} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Create Case
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default NewCase;


















{/* <option value="Mr.">Mr.</option>
<option value="Mrs.">Mrs.</option>
<option value="Smt.">Smt.</option>
<option value="Kumari">Kumari</option>
<option value="Shri.">Shri.</option>
<option value="Miss.">Miss.</option>
<option value="Master">Master</option>
<option value="Mohd.">Mohd.</option>
<option value="Baby">Baby</option>
<option value="Baby of">Baby of</option>
<option value="Wife of">Wife of</option>
<option value="Mother of">Mother of</option>
<option value="Ms.">Ms.</option>
<option value="Miss./Mrs.">Miss./Mrs.</option>
<option value="Selvi">Selvi</option>
<option value="Sk.">Sk.</option>
<option value="PROF">PROF</option>
<option value="Dr.">Dr.</option>
<option value="Child">Child</option>
<option value="Md.">Md.</option>
<option value="Mx.">Mx.</option></select> */}






// update this entire code and give me updated entire code

// import React, { useContext, useState } from "react";
// import { Search } from "lucide-react";
// import { LabContext } from "../context/LabContext";

// const NewCase = () => {
//   const { doctors, agents } = useContext(LabContext);

//   // 🧪 Dummy test data with prices
//   const dummyTests = [
//     { id: 1, name: "Hemoglobin", short: "Hb", category: "Haematology", price: 120 },
//     { id: 2, name: "Total Leukocyte Count", short: "TLC", category: "Haematology", price: 180 },
//     { id: 3, name: "Blood Sugar (Fasting)", short: "BSF", category: "Biochemistry", price: 150 },
//     { id: 4, name: "Liver Function Test", short: "LFT", category: "Biochemistry", price: 600 },
//     { id: 5, name: "Widal Test", short: "WID", category: "Serology & Immunology", price: 250 },
//     { id: 6, name: "Urine Routine", short: "URT", category: "Clinical Pathology", price: 100 },
//     { id: 7, name: "Sputum Culture", short: "SPC", category: "Microbiology", price: 400 },
//     { id: 8, name: "Thyroid Function Test", short: "TFT", category: "Endocrinology", price: 700 },
//     { id: 9, name: "Biopsy", short: "BIO", category: "Histopathology", price: 1500 },
//     { id: 10, name: "Vitamin D", short: "Vit-D", category: "Miscellaneous", price: 800 },
//   ];

//   // 🧍‍♀️ Patient data
//   const [formData, setFormData] = useState({
//     mobile: "",
//     title: "",
//     firstName: "",
//     lastName: "",
//     age: "",
//     sex: "",
//     uhid: "",
//     doctor: "",
//     agent: "",
//     center: "Main",
//     onlineReport: false,
//     email: "",
//     address: "",
//     aadhaar: "",
//     history: "",
//   });

//   // 💳 Payment data
//   const [payment, setPayment] = useState({
//     total: 0,
//     discount: 0,
//     received: 0,
//     collection: 0,
//     mode: "cash",
//     remarks: "",
//   });

//   // 🧾 Investigation categories and selections
//   const categories = [
//     "LAB",
//     "USG",
//     "DIGITAL XRAY",
//     "XRAY",
//     "OUTSOURCE LAB",
//     "ECG",
//     "CT SCAN",
//     "MRI",
//     "CARDIOLOGY",
//     "EEG",
//   ];
//   const [activeCategories, setActiveCategories] = useState([]);
//   const [selectedTests, setSelectedTests] = useState({});

//   // Extra optional fields
//   const [showFields, setShowFields] = useState({
//     email: false,
//     address: false,
//     aadhaar: false,
//     history: false,
//   });

//   // Handlers
//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   const toggleField = (field) => {
//     setShowFields((prev) => ({ ...prev, [field]: !prev[field] }));
//   };

//   const handleCategoryClick = (cat) => {
//     setActiveCategories((prev) =>
//       prev.includes(cat)
//         ? prev.filter((c) => c !== cat)
//         : [...prev, cat]
//     );
//   };

//   const handleTestSelect = (cat, e) => {
//     const selectedIds = Array.from(e.target.selectedOptions, (o) => parseInt(o.value));

//     setSelectedTests((prev) => ({
//       ...prev,
//       [cat]: selectedIds,
//     }));

//     // Calculate new total
//     const allSelectedIds = Object.values({
//       ...selectedTests,
//       [cat]: selectedIds,
//     }).flat();

//     const total = allSelectedIds
//       .map((id) => dummyTests.find((t) => t.id === id)?.price || 0)
//       .reduce((a, b) => a + b, 0);

//     setPayment((prev) => ({ ...prev, total }));
//   };

//   const balance = payment.total - payment.discount - payment.received + payment.collection;

//   return (
//     <div className="w-full mx-auto p-6 bg-white rounded-xl shadow">
//       {/* PATIENT DETAILS */}
//       <h2 className="text-xl font-semibold mb-4">Patient details</h2>

//       {/* Mobile number */}
//       <div className="mb-4">
//         <label className="block text-sm font-medium mb-1">
//           Mobile number{" "}
//           <span className="text-gray-400">(Find existing patients by mobile)</span>
//         </label>
//         <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
//           <span className="px-3 py-2 border-r bg-gray-50 text-gray-700 text-sm">+91</span>
//           <input
//             type="text"
//             name="mobile"
//             placeholder="Enter mobile number"
//             value={formData.mobile}
//             onChange={handleChange}
//             className="flex-1 px-3 py-2 outline-none text-sm"
//           />
//           <button className="px-3 py-2 text-gray-500 hover:text-gray-700">
//             <Search size={18} />
//           </button>
//         </div>
//       </div>

//       {/* Title, name, sex */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-7">
//         <div className="flex gap-3 items-center">
//           <div>
//             <label className="block text-sm mb-1">Title*</label>
//             <input
//               list="titles"
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               className="w-35 border border-gray-300 rounded-lg px-3 py-2"
//               placeholder="Select title..."
//             />
//             <datalist id="titles">
//               {["Mr.", "Mrs.", "Dr.", "Ms.", "Baby", "Master", "Miss."].map((t) => (
//                 <option key={t} value={t} />
//               ))}
//             </datalist>
//           </div>

//           <div>
//             <label className="block text-sm mb-1">First name*</label>
//             <input
//               type="text"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//               className="w-full border border-gray-300 rounded-lg px-3 py-2"
//             />
//           </div>
//         </div>

//         <div>
//           <label className="block text-sm mb-1">Last name</label>
//           <input
//             type="text"
//             name="lastName"
//             value={formData.lastName}
//             onChange={handleChange}
//             className="w-full border border-gray-300 rounded-lg px-3 py-2"
//           />
//         </div>

//         <div>
//           <label className="block text-sm mb-1">Sex*</label>
//           <div className="flex gap-4">
//             {["Male", "Female", "Other"].map((s) => (
//               <label key={s}>
//                 <input
//                   type="radio"
//                   name="sex"
//                   value={s}
//                   checked={formData.sex === s}
//                   onChange={handleChange}
//                   className="mr-1"
//                 />
//                 {s}
//               </label>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Age & UHID */}
//       <div className="flex flex-col md:flex-row gap-4 mt-7">
//         <div>
//           <label className="block text-sm mb-1">Age*</label>
//           <input
//             type="number"
//             name="age"
//             value={formData.age}
//             onChange={handleChange}
//             className="border border-gray-300 rounded-lg px-3 py-2"
//           />
//         </div>
//         <div>
//           <label className="block text-sm mb-1">PPA / Insurance</label>
//           <input
//             type="text"
//             name="uhid"
//             value={formData.uhid}
//             onChange={handleChange}
//             className="border border-gray-300 rounded-lg px-3 py-2"
//           />
//         </div>
//       </div>

//       {/* Online Report */}
//       <div className="mt-3">
//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             name="onlineReport"
//             checked={formData.onlineReport}
//             onChange={handleChange}
//           />
//           Online report requested
//         </label>
//       </div>

//       {/* Optional fields */}
//       <div className="flex flex-wrap gap-4 mb-6 mt-6">
//         {["email", "address", "aadhaar", "history"].map((field) => (
//           <div key={field} className="flex flex-col">
//             <button
//               type="button"
//               onClick={() => toggleField(field)}
//               className="px-4 py-1 text-sm border border-gray-300 rounded-full bg-gray-50 hover:bg-gray-100"
//             >
//               {showFields[field] ? `✖ ${field}` : `➕ ${field}`}
//             </button>
//             {showFields[field] &&
//               (field === "history" ? (
//                 <textarea
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   placeholder={`Enter ${field}`}
//                   className="mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm w-52"
//                 />
//               ) : (
//                 <input
//                   type={field === "email" ? "email" : "text"}
//                   name={field}
//                   value={formData[field]}
//                   onChange={handleChange}
//                   placeholder={`Enter ${field}`}
//                   className="mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm w-52"
//                 />
//               ))}
//           </div>
//         ))}
//       </div>

//       {/* Case details */}
//       <h2 className="text-xl font-semibold mb-4">Case details</h2>

      

//       {/* Category tabs */}
//       <div className="flex flex-wrap gap-2 my-6">
//         {categories.map((tab) => (
//           <button
//             key={tab}
//             onClick={() => handleCategoryClick(tab)}
//             className={`px-4 py-2 rounded-md font-medium transition ${
//               activeCategories.includes(tab)
//                 ? "bg-blue-600 text-white"
//                 : "bg-blue-100 text-blue-700 hover:bg-blue-200"
//             }`}
//           >
//             {tab}
//           </button>
//         ))}
//       </div>

//       {/* Investigation sections */}
//       {activeCategories.map((cat) => (
//         <div key={cat} className="bg-white p-4 rounded-xl shadow-sm mb-6 border">
//           <h2 className="font-semibold mb-2 text-gray-700">{cat} Investigations</h2>

//           <select
//             multiple
//             value={selectedTests[cat] || []}
//             onChange={(e) => handleTestSelect(cat, e)}
//             className="w-full border rounded-md p-2 mb-4 h-32"
//           >
//             {dummyTests.map((test) => (
//               <option key={test.id} value={test.id}>
//                 {test.id} — {test.name} ({test.short}) — ₹{test.price}
//               </option>
//             ))}
//           </select>

//           {selectedTests[cat]?.length > 0 && (
//             <div className="border-t pt-3 mt-3 text-sm">
//               <p className="font-medium mb-2 text-gray-700">Selected Tests:</p>
//               <ul className="list-disc ml-6 space-y-1 text-gray-600">
//                 {selectedTests[cat].map((id) => {
//                   const test = dummyTests.find((t) => t.id === id);
//                   return (
//                     <li key={id}>
//                       {test.name} ({test.short}) — ₹{test.price}
//                     </li>
//                   );
//                 })}
//               </ul>
//             </div>
//           )}

//           <div className="mt-3 text-sm text-gray-600">
//             Total: ₹{payment.total}, Due: ₹{balance}
//           </div>
//         </div>
//       ))}

//       {/* Payment Details */}
//       <div className="bg-white p-4 rounded-xl shadow-sm border">
//         <h3 className="font-semibold mb-4 text-gray-700">Payment Details</h3>

//         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//           {[
//             { label: "Total (Rs)", key: "total" },
//             { label: "Discount", key: "discount" },
//             { label: "Amount Received", key: "received" },
//             { label: "Collection Charge", key: "collection" },
//           ].map((item) => (
//             <div key={item.key}>
//               <label className="text-sm text-gray-600">{item.label}</label>
//               <input
//                 type="number"
//                 className="w-full border p-2 rounded-md"
//                 value={payment[item.key]}
//                 onChange={(e) => setPayment({ ...payment, [item.key]: +e.target.value })}
//               />
//             </div>
//           ))}

//           <div>
//             <label className="text-sm text-gray-600">Mode</label>
//             <select
//               className="w-full border p-2 rounded-md"
//               value={payment.mode}
//               onChange={(e) => setPayment({ ...payment, mode: e.target.value })}
//             >
//               <option value="cash">Cash</option>
//               <option value="card">Card</option>
//               <option value="upi">UPI</option>
//             </select>
//           </div>

//           <div>
//             <label className="text-sm text-gray-600">Remarks</label>
//             <input
//               type="text"
//               className="w-full border p-2 rounded-md"
//               placeholder="Any remarks..."
//               value={payment.remarks}
//               onChange={(e) => setPayment({ ...payment, remarks: e.target.value })}
//             />
//           </div>
//         </div>

//         <div className="mt-4 text-red-600 font-semibold">
//           Balance: ₹{balance.toFixed(2)}
//         </div>

//         <div className="flex justify-between mt-6">
//           <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
//             Create Case
//           </button>
//           <button className="border px-4 py-2 rounded-md flex items-center gap-1 hover:bg-gray-100">
//             ⚙️ Settings
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NewCase;

