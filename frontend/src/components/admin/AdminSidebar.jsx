import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LabContext } from "../../context/LabContext";
import axios from "axios";

const AdminSidebar = () => {
  const { showside, setshowside, navigate,  selectedBranch, setSelectedBranch, adminToken, errorToast } =
    useContext(LabContext);

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false)

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

  console.log(branches);
  

  const [open, setOpen] = useState({
    business: false,
    cases: false,
    lab: false,
    branches: false,
    data: false,
    reports: false,
  });

  const toggleMenu = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const MenuItem = ({ icon, text, to }) => (
    <Link
      to={to}
      onClick={() => setshowside(false)}
      className="flex gap-2 items-center hover:bg-gray-200 px-3 py-2 rounded transition w-full"
    >
      <img src={icon} alt="" className="w-5 h-5" />
      <p className="text-secondary text-[15px] whitespace-nowrap">{text}</p>
    </Link>
  );

  const Section = ({ title, icon, name, children }) => (
    <div className="w-full">
      <div
        onClick={() => toggleMenu(name)}
        className="flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-gray-200 cursor-pointer w-full"
      >
        <div className="flex gap-2 items-center">
          <img src={icon} alt="" className="w-4 h-4" />
          <p className="text-secondary roboto-third">{title}</p>
        </div>
        <img
          src="/down-lims.png"
          className={`w-4 h-4 transform transition ${open[name] ? "rotate-180" : ""}`}
          alt=""
        />
      </div>
      <div
        className={`mx-3 mt-2 ${open[name] ? "flex" : "hidden"
          } flex-col transition-all duration-300`}
      >
        {children}
      </div>
    </div>
  );

  return (
    <>
    <div className="print:hidden">
      {/* ✅ Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <img
          src="/menu-lims.png"
          onClick={() => setshowside(true)}
          alt="Menu"
          className="w-9 h-9 cursor-pointer"
        />
      </div>

      {/* ✅ Overlay for mobile */}
      {showside && (
        <div
          onClick={() => setshowside(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        ></div>
      )}

      {/* ✅ Sidebar (Desktop + Mobile) */}
      <div
        className={`fixed bg-[#F9FAFB] border-r border-gray-300 z-50 transition-all duration-300 ${showside ? "left-0" : "-left-[100%]"
          } md:left-0 md:w-[14%] w-[80%] h-screen flex flex-col px-2 py-4`}
      >
        {/* ✅ New Case Button */}
        <button
          onClick={() => {
            navigate("/admin/new-case");
            scrollTo(0, 0);
            setshowside(false);
          }}
          className="px-10 py-2 cursor-pointer flex items-center gap-2 text-white roboto-third bg-primary rounded-3xl hover:bg-primary-dark transition mx-auto"
        >
          <span className="text-xl -mt-1">+</span>
          <span className="text-[15px] whitespace-nowrap">New Bill</span>
        </button>

        {/* ✅ Mobile Branch Selector */}
        <div className="md:hidden mt-4 w-full px-3">
          <label className="text-xs text-gray-600">Select Branch</label>
          <select
                    name="branch"
                    value={selectedBranch || ""}
                    onChange={(e) => setSelectedBranch(e.target.value || null)}
                    className="w-full mt-1 border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="">All</option>
                    {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                            {b.name} ({b.place})
                        </option>
                    ))}
                </select>
        </div>

        

        {/* ✅ Sidebar Content */}
        <div className="flex flex-col items-start justify-start mt-5 w-full overflow-y-auto h-[80vh]">
          {/* Dashboard */}
          <MenuItem icon="/home-lims.png" text="Dashboard" to="/admin/dashboard" />

          {/* Branches Tab */}
          <Section title="Branches" icon="/branch.png" name="branches">
            <MenuItem icon="/list.png" text="All Branches" to="/admin/branches" />
            <MenuItem icon="/add-branch.png" text="Add Branch" to="/admin/add-branch" />
            <MenuItem icon="/branch-remove.png" text="Delete Branch" to="/admin/delete-branch" />
          </Section>

          {/* Business */}
          

          {/* Cases */}
          <Section title="Cases" icon="/case.png" name="cases">
            <MenuItem icon="/list.png" text="All Cases" to="/admin/all-cases" />
            <MenuItem
              icon="/transactional-data.png"
              text="Transactions"
              to="/admin/transactions"
            />
            <MenuItem icon="/stethoscope.png" text="Referral Doctors" to="/admin/doctors" />
            <MenuItem icon="/realtor.png" text="Agents" to="/admin/agents" />
          </Section>

          {/* Lab Master */}
          {/* Lab Master */}
          <Section title="Lab (Master)" icon="/test-tube.png" name="lab">
          
            <MenuItem icon="/list.png" text="All Reports" to="/admin/all-reports" />
            <MenuItem icon="/server.png" text="Test Database" to="/admin/test-database" />
            <MenuItem icon="/menu-2.png" text="Test Departments" to="/admin/test-categories" />
            <MenuItem icon="/boxes.png" text="Test Panels" to="/admin/test-panels" />
            <MenuItem icon="/package-box.png" text="Test Packages" to="/admin/test-packages" />
            <MenuItem icon="/i.png" text="Interpretations" to="/admin/interpretations" />
            <MenuItem icon="/behavior.png" text="Preferred tests" to="/admin/preferred-test" />
            <MenuItem icon="/drugs.png" text="Approve Branch Tests" to="/admin/approve-branch-test" />
          </Section>


          {/* Data Transfer */}
          <Section title="Data Transfer" icon="/data.png" name="data">
            <MenuItem icon="/export.png" text="Export All Data" to="/admin/export-data" />
            <MenuItem icon="/branch.png" text="Multi-Branch Export" to="/admin/multi-branch-export" />
            <MenuItem icon="/backup.png" text="Automated Backup" to="/admin/backup" />
            <MenuItem icon="/export-log.png" text="Export Logs" to="/admin/export-logs" />
          </Section>

          {/* Reports */}
          <Section title="Reports" icon="/add-task.png" name="reports">
            <MenuItem icon="/report.png" text="Report Templates" to="/admin/report-temp" />
            <MenuItem icon="/report.png" text="Message Templates" to="/admin/msg-temp" />
            
            <MenuItem icon="/letter.png" text="Letter Head" to="/admin/letter" />
            <MenuItem icon="/signature.png" text="Signatures" to="/admin/signatures" />
          </Section>
        </div>
      </div>
      </div>
    </>
  );
};

export default AdminSidebar;

