import React, { useContext, useEffect, useState } from "react";
import { Search } from "lucide-react";

import { useLocation } from "react-router-dom";
import Select, { components } from "react-select";



import axios from "axios";
import { LabContext } from "../../context/LabContext";

const AdminNewCase = () => {
  const { doctors, agents, dummyTests, dummyPanels, branchId, branchToken, successToast, errorToast, selectedBranch, adminToken, navigate } =
    useContext(LabContext);

const [ageError, setAgeError] = useState("");

     const [msgTemplates, setMsgTemplates] = useState([]); // fetched templates
    const [selectedTemplates, setSelectedTemplates] = useState([]); // array of selected template IDs


    const [errors, setErrors] = useState({});
      
      
      const validateForm = () => {
        const newErrors = {};
      
        // 📱 Mobile number (India)
        if (!formData.mobile) {
          newErrors.mobile = "Mobile number is required";
        } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
          newErrors.mobile = "Enter a valid 10-digit mobile number";
        }
      
        // 👤 First Name
        if (!formData.firstName) {
          newErrors.firstName = "First name is required";
        } else if (!/^[A-Za-z ]{2,}$/.test(formData.firstName)) {
          newErrors.firstName = "Only alphabets allowed (min 2 letters)";
        }
      
        // 🎂 Age
        if (formData.age === "" || formData.age === null) {
          newErrors.age = "Age is required";
        } else if (isNaN(formData.age)) {
          newErrors.age = "Age must be a number";
        } else if (formData.age < 0 || formData.age > 120) {
          newErrors.age = "Age must be between 0 and 120";
        }
      
        // 🧑‍⚕️ Referred By
        if (!formData.doctor) {
          newErrors.doctor = "Referred By is required";
        }
      
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };
    


    const location = useLocation();
const prefill = location.state || {};


const CustomMenuList = (props) => {
  return (
    <>
      <components.MenuList {...props}>
        {props.children}
      </components.MenuList>

      {/* Bottom fixed buttons inside dropdown */}
      <div className="p-2 border-t bg-gray-50 flex justify-between">
        <button
          className="text-blue-600 text-sm font-medium hover:underline"
          onClick={() => navigate(`/admin/add-test-manually`, { state: { openModal: true } })}
        >
          + Add New
        </button>

        <button
          className="text-green-600 text-sm font-medium hover:underline"
          onClick={() => navigate(`/admin/rate-list`)}
        >
          Rate List
        </button>
      </div>
    </>
  );
};


    
    
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
    mobile: prefill.mobile || "",
    title: prefill.title || "",
    firstName: prefill.firstName || "",
    lastName: prefill.lastName || "",
    age: prefill.age || "",
    sex: prefill.sex || "",
    uhid: prefill.uhid || "",
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
    "XRAY",
    "USG",
    
    "OUTSOURCE",
    "OTHER",
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

  if (name === "age") {
    let age = Number(value);

    if (age > 120) {
      setAgeError("Age should not exceed 120");
      age = 120; // auto-limit
    } else {
      setAgeError("");
    }

    return setFormData((prev) => ({ ...prev, age }));
  }

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

    // Recalculate total
    const allSelectedTests = Object.values(updatedTests)
      .flat()
      .map((id) => dummyTests.find((t) => t._id === id) || dummyPanels.find((p) => p._id === id));
    const total = allSelectedTests.reduce((sum, t) => sum + (t?.price || 0), 0);
    setPayment((prev) =>
  updateBalance({
    ...prev,
    total,
    received: total,   // 👈 auto-fill received
  })
);

  };

  // ---------------- API Call ----------------
  const handleCreateCase = async () => {
    if (!validateForm()) {
    errorToast("Incomplete patient information. Please verify and submit again");

    return;
  }
    try {
      const caseData = {
  branchId: selectedBranch,
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
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/cases/admin/add`, caseData, config);

      if (response.data.success) {
      const newCase = response.data.data;
      successToast("Case created successfully!");
      
      navigate(`/admin/enter-result/${newCase._id}`)
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
  value={formData.mobile}
  onChange={handleChange}
  className={`flex-1 px-3 py-2 outline-none text-sm ${
    errors.mobile ? "border-red-500" : ""
  }`}
/>
{errors.mobile && (
  <p className="text-red-600 text-sm mt-1">{errors.mobile}</p>
)}
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
  className={`w-full border rounded-lg px-3 py-2 ${
    errors.firstName ? "border-red-500" : "border-gray-300"
  }`}
/>
{errors.firstName && (
  <p className="text-red-600 text-xs">{errors.firstName}</p>
)}
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
    min="0"
    max="120"
    className={`border rounded-lg px-3 py-2 ${
      errors.age ? "border-red-500" : "border-gray-300"
    }`}
  />

  {errors.age && (
    <p className="text-red-600 text-sm mt-1">{errors.age}</p>
  )}
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
  className={`w-full border rounded-lg px-3 py-2 ${
    errors.doctor ? "border-red-500" : "border-gray-300"
  }`}
/>
{errors.doctor && (
  <p className="text-red-600 text-xs">{errors.doctor}</p>
)}
            <datalist id="doctors">
              {doctors.map((doc,) => (
                <option key={doc._id} value={`${doc.name}`} />
              ))}
            </datalist>
          </div>
          <div
  onClick={() => navigate('/admin/doctors', { state: { openModal: true } })}
  className="px-2 py-1 rounded border border-blue-500 w-30 md:mt-6"
>
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
 let combinedOptions = [];

// Always include category tests
combinedOptions = [
  ...filteredTests.map((test) => ({
    value: test._id,
    label: `🧪 ${test.name} (${test.shortName || test.short}) — ₹${test.price}`,
    type: "test",
  })),
];

// Add panels ONLY for LAB
if (cat === "LAB") {
  combinedOptions.push(
    ...dummyPanels.map((panel) => ({
      value: panel._id,
      label: `📋 ${panel.name} (Panel) — ₹${panel.price}`,
      type: "panel",
    }))
  );
}


  // ✅ Get selected tests/panels for this category
  // ✅ Get selected tests/panels for this category
const selectedForCat = (selectedTests[cat] || []).map((id) => {
  return dummyTests.find((t) => t._id === id) || dummyPanels.find((p) => p._id === id);
});

// ✅ Format selected values for react-select
const selectedOptions = selectedForCat.map((t) => ({
  value: t._id,
  label:
    t.type === "panel"
      ? `📋 ${t.name} (Panel) — ₹${t.price}`
      : `🧪 ${t.name} (${t.shortName}) — ₹${t.price}`,
}));


  // ✅ Calculate subtotal for the category
  const categoryTotal = selectedForCat.reduce((sum, t) => sum + (t.price || 0), 0);

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
        components={{ MenuList: CustomMenuList }}
      />

      {selectedForCat.length > 0 && (
        <div className="border-t pt-3 mt-3 text-sm">
          <p className="font-medium mb-2 text-gray-700">Selected Tests:</p>
          <ul className="list-disc ml-6 space-y-1 text-gray-600">
  {selectedForCat.map((test) => (
    <li key={test._id}>
      {test._id} — {test.name} ({test.shortName || test.short}) — ₹{test.price}
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

export default AdminNewCase;



