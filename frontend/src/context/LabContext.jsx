import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast'
import axios from "axios";


export const LabContext = createContext()

const LabContextProvider = ({children}) => {

  const currency = "₹"

    const navigate = useNavigate()
    const [branchId, setBranchId] = useState(null);
    const [branchData, setBranchData] = useState(null)
    const [todaysIncome, setTodaysIncome] = useState(0);
     
     const [branchToken, setBranchToken] = useState(localStorage.getItem("branchToken"))

    const [branches, setBranches] = useState(null)
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [adminToken, setAdminToken] = useState(null);
    const [dummyTests, setDummyTests] = useState([])
    const [dummyPanels, setDummyPanels] = useState([])
    const [packages, setPackages] = useState([])
    const [doctors, setDoctors] = useState([])
    const [agents, setAgents] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    const [categories, setCategories] = useState([]);

    const fetchTodaysIncome = async () => {
  if (!adminToken) return;

  try {
    const caseRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/cases/admin/list`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const caseData = Array.isArray(caseRes.data?.data) ? caseRes.data.data : [];

    // Get today's date in local time
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todaysCases = caseData.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= todayStart && created < todayEnd;
    });

    const todaysRevenue = todaysCases.reduce((sum, c) => sum + (c.payment?.total || 0), 0);
    setTotalRevenue(todaysRevenue);

  } catch (err) {
    console.error("Error fetching today's income:", err);
  }
};

// Fetch today's income whenever adminToken changes
useEffect(() => {
  fetchTodaysIncome();
}, [adminToken]);

useEffect(() => {
  if (!branchId) return;

  const fetchTodaysIncome = async () => {
    try {
     
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cases/branch/list/${branchId}`,
        { headers: { Authorization: `Bearer ${branchToken}` } }
      );

      if (res.data.success && res.data.data) {
        const casesData = res.data.data;

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const income = casesData
          .filter(c => {
            const created = new Date(c.createdAt);
            return created >= todayStart && created < todayEnd && c.status === "no due";
          })
          .reduce((sum, c) => sum + (c.payment?.total || 0), 0);

        setTodaysIncome(income);
      }
    } catch (err) {
      console.error(err);
      errorToast(err?.message || "Failed to fetch today's income");
    } 
  };

  fetchTodaysIncome();
}, [branchId, branchToken]);


      
    
      // Fetch all global categories
      useEffect(() => {
        const fetchCategories = async () => {
          try {
            // ✅ Use correct route based on user type
            const url = adminToken
              ? `${import.meta.env.VITE_API_URL}/api/test/category/admin/list`
              : `${import.meta.env.VITE_API_URL}/api/test/category/list`;
    
            const headers = adminToken
              ? { Authorization: `Bearer ${adminToken}` }
              : { Authorization: `Bearer ${branchToken}` };
    
            const res = await axios.get(url, { headers });
            if (res.data.success) setCategories(res.data.categories.reverse());
    
          } catch (err) {
            console.error("Error fetching categories:", err);
            errorToast?.("Failed to fetch categories");
          }
        };
    
        fetchCategories();
      }, [adminToken, branchToken]);

      // Fetch tests from backend
  useEffect(() => {
    const fetchTests = async () => {
      try {
        
        let url = "";

        if (adminToken) {
          url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/list`;
        } else if (branchToken) {
          url = `${import.meta.env.VITE_API_URL}/api/test/database/list`;
        } else {
          errorToast?.("Unauthorized! Cannot fetch tests.");
          
          return;
        }

        const headers = adminToken
          ? { Authorization: `Bearer ${adminToken}` }
          : { Authorization: `Bearer ${branchToken}` };

        const res = await axios.get(url, { headers });

        console.log("tests", res.data);
        

        if (res.data.success && res.data.tests) {
          setDummyTests(res.data.tests.reverse());
        } else {
          errorToast?.(res.data.message || "Failed to fetch tests");
        }
      } catch (err) {
        console.error("Error fetching tests:", err);
        errorToast?.("Error fetching tests");
      } 
    };

    fetchTests();
  }, [adminToken, branchId]);

  

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const token = adminToken || branchToken;
        const headers = { Authorization: `Bearer ${token}` };

        const url = adminToken
          ? `${import.meta.env.VITE_API_URL}/api/test/panels/admin/list`
          : `${import.meta.env.VITE_API_URL}/api/test/panels/list`;

        const res = await axios.get(url, { headers });

        console.log("panels", res.data.panels);
        

        if (res.data.success) {
          setDummyPanels(res.data.panels || []);
        } else {
          errorToast(res.data.message || "Failed to load panels");
        }
      } catch (err) {
        console.error("Error fetching panels:", err);
        errorToast("Error fetching panels");
      } 
    };

    fetchPanels();
  }, [adminToken, branchToken]);


  useEffect(() => {
    const fetchPackages = async () => {
      try {
       
        const url = adminToken
          ? `${import.meta.env.VITE_API_URL}/api/test/packages/admin/list`
          : `${import.meta.env.VITE_API_URL}/api/test/packages/list`;

        const token = adminToken || branchToken;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setPackages(res.data.packages.reverse() || []);
        } else {
          errorToast("Failed to fetch packages.");
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
        errorToast(err.response?.data?.message || "Failed to fetch packages.");
      } 
    };

    fetchPackages();
  }, [adminToken, branchToken]);
  
      

  const addToCartToast = (item) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } flex items-center gap-5 bg-white border border-[#FBA83B] px-5 py-3 rounded shadow-md`}
      >
        {/* Image */}
        <img
          src="/shopping.gif" 
          alt={item.title}
          className="w-10 h-10 rounded object-cover"
        />

        {/* Text */}
        <div className="text-sm">
          <p className="font-semibold text-gray-900">{item.title}</p>
          <p className="text-gray-600">Added to cart</p>
        </div>
      </div>
    ),
    {
      duration: 2500, // ⏱ auto dismiss after 3s
      position: "top-center", // optional: control position
    }
  );
};
const errorToast = (msg) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } flex items-center gap-5 bg-white border border-[#FBA83B] px-5 py-2 rounded shadow-md`}
      >
        {/* Image */}
        <img
          src="/wrong.gif" 
          
          className="w-10 h-10 rounded object-cover"
        />

        {/* Text */}
        <div className="text-sm">
          <p className="font-semibold text-gray-900">{msg}</p>
          
        </div>
      </div>
    ),
    {
      duration: 2500, // ⏱ auto dismiss after 3s
      position: "top-center", // optional: control position
    }
  );
};
const successToast = (msg) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } flex items-center gap-5 bg-white border border-[#FBA83B] px-5 py-2 rounded shadow-md`}
      >
        {/* Image */}
        <img
          src="/okay.gif" 
          
          className="w-10 h-10 rounded object-cover"
        />

        {/* Text */}
        <div className="text-sm">
          <p className="font-semibold text-gray-900">{msg}</p>
          
        </div>
      </div>
    ),
    {
      duration: 2500, // ⏱ auto dismiss after 3s
      position: "top-center", // optional: control position
    }
  );
};
const removeToast = (msg) => {
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } flex items-center gap-5 bg-white border border-[#FBA83B] px-5 py-2 rounded shadow-md`}
      >
        {/* Image */}
        <img
          src="/remove.gif" 
          
          className="w-10 h-10 rounded object-cover"
        />

        {/* Text */}
        <div className="text-sm">
          <p className="font-semibold text-gray-900">{msg}</p>
          
        </div>
      </div>
    ),
    {
      duration: 2500, // ⏱ auto dismiss after 3s
      position: "top-center", // optional: control position
    }
  );
};





useEffect(() => {
    axios.defaults.headers.common["Authorization"] = adminToken
      ? `Bearer ${adminToken}`
      : "";
  }, [adminToken]);

  //  useEffect(() => {
  //   if (!adminToken) {
  //     navigate("/admin-login");
  //   }
  // }, [adminToken, navigate]);

 


  useEffect(() => {
    
    

    if (branchId && branchToken) {
      const fetchBranch = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/branchData/${branchId}`,
            {
              headers: {
                Authorization: `Bearer ${branchToken}`,
              },
            }
          );
          
          
          setBranches(res.data);
          
          
          
          
        } catch (err) {
          console.error("Failed to fetch branch:", err);
        }
      };
      fetchBranch();
    }
  }, [branchId]);


//     const dummyPanels = [
//   {
//     id: "1",
//     name: "CBC (with absolute counts)",
//     category: "Haematology",
//     tests: ["Hemoglobin", "Total RBC Count", "Hematocrit Value", "Hct"],
//     ratelist: ["CBC (with absolute counts)", "LIC 1", "PCT"],
//   },
//   {
//     id: "2",
//     name: "Complete Blood Count (CBC)",
//     category: "Haematology",
//     tests: ["Hemoglobin", "WBC Count", "ESR", "Platelet Count"],
//     ratelist: ["CBC", "PCT", "SDL BASIC A"],
//   },
//   {
//     id: "3",
//     name: "Liver Function Test (LFT)",
//     category: "Biochemistry",
//     tests: ["SGPT", "SGOT", "Albumin", "Bilirubin"],
//     ratelist: ["LFT", "INSURANCE"],
//   },
//   {
//     id: "4",
//     name: "Kidney Function Test (KFT)",
//     category: "Biochemistry",
//     tests: ["Creatinine", "Urea", "Uric Acid", "Electrolytes"],
//     ratelist: ["KFT", "RENAL PANEL"],
//   },
//   {
//     id: "5",
//     name: "Thyroid Profile",
//     category: "Endocrinology",
//     tests: ["T3", "T4", "TSH"],
//     ratelist: ["THYROID PANEL", "BASIC CHECKUP"],
//   },
//   {
//     id: "6",
//     name: "Lipid Profile",
//     category: "Biochemistry",
//     tests: ["Total Cholesterol", "HDL", "LDL", "Triglycerides"],
//     ratelist: ["LIPID", "CARDIAC CHECKUP"],
//   },
//   {
//     id: "7",
//     name: "Diabetes Profile",
//     category: "Biochemistry",
//     tests: ["Fasting Glucose", "PPBS", "HbA1c"],
//     ratelist: ["DIABETES", "SUGAR PANEL"],
//   },
//   {
//     id: "8",
//     name: "Iron Studies",
//     category: "Biochemistry",
//     tests: ["Serum Iron", "Ferritin", "TIBC"],
//     ratelist: ["IRON PANEL", "ANEMIA CHECKUP"],
//   },
//   {
//     id: "9",
//     name: "Vitamin Profile",
//     category: "Biochemistry",
//     tests: ["Vitamin B12", "Vitamin D3"],
//     ratelist: ["VITAMIN PANEL", "BASIC NUTRITION"],
//   },
//   {
//     id: "10",
//     name: "Electrolyte Panel",
//     category: "Biochemistry",
//     tests: ["Sodium", "Potassium", "Chloride"],
//     ratelist: ["ELECTROLYTE", "ICU PANEL"],
//   },
//   {
//     id: "11",
//     name: "Infection Panel",
//     category: "Microbiology",
//     tests: ["CRP", "Dengue NS1", "Widal Test"],
//     ratelist: ["FEVER PANEL", "BASIC INFECTION"],
//   },
//   {
//     id: "12",
//     name: "Cardiac Panel",
//     category: "Biochemistry",
//     tests: ["Troponin I", "CK-MB", "BNP"],
//     ratelist: ["CARDIAC PANEL", "EMERGENCY"],
//   },
//   {
//     id: "13",
//     name: "Pre-Employment Checkup",
//     category: "General Health",
//     tests: ["CBC", "Urine Routine", "Blood Sugar", "Chest X-ray"],
//     ratelist: ["EMPLOYEE CHECKUP", "BASIC HEALTH PACKAGE"],
//   },
// ];



// const dummyTests = [
//   // 🩸 Haematology
//   { id: 1, name: "Hemoglobin", short: "Hb", category: "Haematology", price: 100 },
//   { id: 2, name: "Total Leukocyte Count", short: "TLC", category: "Haematology", price: 150 },
  
//   // 🧪 Biochemistry
//   { id: 3, name: "Blood Sugar (Fasting)", short: "BSF", category: "Biochemistry", price: 120 },
//   { id: 4, name: "Liver Function Test", short: "LFT", category: "Biochemistry", price: 600 },
//   { id: 5, name: "Renal Function Test", short: "RFT", category: "Biochemistry", price: 550 },
//   { id: 6, name: "Lipid Profile", short: "LP", category: "Biochemistry", price: 450 },

//   // 🧬 Serology & Immunology
//   { id: 7, name: "Widal Test", short: "WID", category: "Serology & Immunology", price: 200 },
//   { id: 8, name: "CRP (C-Reactive Protein)", short: "CRP", category: "Serology & Immunology", price: 300 },

//   // 💧 Clinical Pathology
//   { id: 9, name: "Urine Routine", short: "URT", category: "Clinical Pathology", price: 80 },
//   { id: 10, name: "Stool Routine", short: "SRT", category: "Clinical Pathology", price: 100 },

//   // 🔬 Microbiology
//   { id: 11, name: "Sputum Culture", short: "SPC", category: "Microbiology", price: 500 },
//   { id: 12, name: "Blood Culture", short: "BC", category: "Microbiology", price: 700 },

//   // 🧠 Endocrinology
//   { id: 13, name: "Thyroid Function Test", short: "TFT", category: "Endocrinology", price: 400 },
//   { id: 14, name: "Vitamin D", short: "Vit-D", category: "Endocrinology", price: 900 },

//   // 🔎 Histopathology
//   { id: 15, name: "Biopsy", short: "BIO", category: "Histopathology", price: 1200 },

//   // 🩻 Radiology — multiple X-Rays
//   { id: 16, name: "X-Ray Chest PA View", short: "XR-CH", category: "Radiology", price: 300 },
//   { id: 17, name: "X-Ray Ankle (AP/Lateral)", short: "XR-ANK", category: "Radiology", price: 350 },
//   { id: 18, name: "X-Ray Knee (AP/Lateral)", short: "XR-KNE", category: "Radiology", price: 350 },
//   { id: 19, name: "X-Ray Abdomen", short: "XR-ABD", category: "Radiology", price: 400 },
//   { id: 20, name: "Digital X-Ray Chest", short: "DXR-CH", category: "Radiology", price: 500 },
//   { id: 21, name: "X-Ray Hand (AP/Lateral)", short: "XR-HND", category: "Radiology", price: 300 },
//   { id: 22, name: "X-Ray Cervical Spine", short: "XR-CSP", category: "Radiology", price: 400 },

//   // ❤️ Cardiology
//   { id: 23, name: "ECG (Electrocardiogram)", short: "ECG", category: "Cardiology", price: 250 },
//   { id: 24, name: "2D Echo", short: "ECHO", category: "Cardiology", price: 1200 },
//   { id: 25, name: "TMT (Treadmill Test)", short: "TMT", category: "Cardiology", price: 1500 },
//   { id: 26, name: "Holter Monitoring (24 hr)", short: "HOLTER", category: "Cardiology", price: 2500 },
// ];



const fetchDoctors = async () => {
    try {
      
      const token = adminToken || branchToken;
      const endpoint = adminToken
      
        ? `${import.meta.env.VITE_API_URL}/api/doctors/admin/list`
        : `${import.meta.env.VITE_API_URL}/api/doctors/branch/list`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setDoctors(res.data.data.reverse() || []);
      } else {
        errorToast(res.data.message || "Failed to fetch doctors");
      }
    } catch (err) {
      console.error(err);
      errorToast("Error fetching doctors");
    } 
  }

  useEffect(() => {
    fetchDoctors()
  }, [])
  

  const fetchAgents = async () => {
    try {
      
      const token = adminToken || branchToken;
      const endpoint = adminToken
        ? `${import.meta.env.VITE_API_URL}/api/agents/admin/list`
        : `${import.meta.env.VITE_API_URL}/api/agents/branch/list`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAgents(res.data.data.reverse());
      } else {
        errorToast(res.data.message || "Failed to fetch agents");
      }
    } catch (err) {
      console.error(err);
      errorToast("Error fetching agents");
    } finally {
      
    }
  };

  useEffect(() => {
    fetchAgents()
  }, [])
  


    

    const [visible, setvisible] = useState(false)
    const [showside, setshowside] = useState(false)
    
    
    
    

    


 const [selectedBranch, setSelectedBranch] = useState(
  branches && branches.length > 0 ? branches[0]._id : null
);




        





    const value = {
        navigate, currency, visible, setvisible, branchId, setBranchId, branches, dummyPanels, dummyTests, categories, doctors, agents, selectedBranch, setSelectedBranch, showside, setshowside, errorToast, successToast, removeToast, adminToken, setAdminToken, branchToken, branchData, setBranchData, packages, setBranchToken, totalRevenue, setTotalRevenue, setTodaysIncome, todaysIncome, isOpen, setIsOpen,
    }

    return(
        <LabContext.Provider value={value}>
            {children}
        </LabContext.Provider>
    )
}

export default LabContextProvider