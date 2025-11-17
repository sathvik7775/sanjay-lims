import React, { useContext } from 'react'
import AdminNavbar from '../../components/admin/AdminNavbar'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { LabContext } from '../../context/LabContext'
import Dashboard from '../Dashboard'
import Analytics from '../buisness/Analytics'
import AllCases from '../cases/AllCases'
import Transactions from '../cases/Transactions'


import Todaysreports from '../lab/Todaysreports'
import AllReports from '../lab/AllReports'
import Interpretations from '../lab/Interpretations'
import PreferredTest from '../lab/PreferredTest'
import TestPackages from '../lab/TestPackages'
import TestPanels from '../lab/TestPanels'
import TestDatabase from '../lab/TestDatabase'

import ReportTemplates from '../report/ReportTemplates'
import Signatures from '../report/Signatures'
import Bills from '../report/Bills'
import NewCase from '../NewCase'

import Singlepara from '../lab/Singlepara'
import Multiplepara from '../lab/Multiplepara'
import Nestedpara from '../lab/Nestedpara'
import Documentpara from '../lab/Documentpara'

import AddTestPanel from '../lab/AddTestPanel'
import AddTestPackage from '../lab/AddTestPackage'
import { Route, Routes } from 'react-router-dom'
import DeleteBranch from './branches/DeleteBranch'
import ApproveBranch from './lab master/ApproveBranch'
import ExportData from './data/ExportData'
import MultiExport from './data/MultiExport'
import Backup from './data/Backup'
import ExportLogs from './data/ExportLogs'
import AllBranch from './branches/AllBranch'
import AddBranch from './branches/AddBranch'
import EditBranch from './branches/EditBranch'
import AdminCases from './admin cases/AdminCases'
import AdminTransactions from './admin cases/AdminTransactions'
import AdminDotors from './admin cases/AdminDotors'
import AdminAgents from './admin cases/AdminAgents'
import AdminDashBoard from './AdminDashBoard'

import NewCategory from '../lab/NewCatagory'
import TestCategories from '../lab/TestCatagories'
import EditCategory from '../lab/EditCategory'
import EditSinglepara from '../lab/edit test/EditSinglepara'
import EditMultiplepara from '../lab/edit test/EditMultiplepara'
import EditNestedpara from '../lab/edit test/EditNestedpara'
import EditDocumentpara from '../lab/edit test/EditDocumentpara'
import EditPanels from '../lab/EditPanels'
import EditPackage from '../lab/EditPackage'
import Letterhead from '../report/LetterHead'
import EditValues from '../../components/EditValues'
import TestView from '../lab/TestView'
import AddLetterhead from '../report/AddLetterhead'
import AddSignature from '../report/AddSignature'
import AdminNewCase from './AdminNewCase'
import EditAdminCase from './EditAdminCase'
import AdminBillPage from '../report/AdminBillPage'
import AdminAllReports from './lab master/AdminAllReports'
import AdminEnterResults from '../report/AdminEnterResults'
import Doctors from '../cases/Doctors'
import Agents from '../cases/Agents'
import AdminViewReport from '../report/AdminViewReport'
import AdminEditResult from '../report/AdminEditResult'
import Notification from '../../components/Notification'
import PrintSettings from '../report/PrintSettings'
import AdminPrintSetting from '../report/AdminPrintSetting'
import AddTestManually from '../lab/AddTestManually'
import WhatsappTemplates from '../report/WhatsappTemplates'
import RateList from '../lab/RateList'
import TodaysAdminreports from './lab master/TodaysAdminReports'


const AdminHome = () => {
  const { selectedBranch } = useContext(LabContext)
  return (
    <div>
      <AdminNavbar />
      

      <div className='flex w-full'>
        <AdminSidebar />
        <Notification/>

        <div className="md:w-[86%] w-full ml-auto">
          <Routes>
            {/* ✅ Dashboard */}
            <Route path="dashboard" element={<AdminDashBoard selectedBranch={selectedBranch} />} />

            {/* ✅ Business */}
            <Route path="analytics" element={<Analytics selectedBranch={selectedBranch} />} />

            {/* ✅ Cases */}
            <Route path="all-cases" element={<AdminCases selectedBranch={selectedBranch} />} />
            <Route path="transactions" element={<AdminTransactions selectedBranch={selectedBranch} />} />
            <Route path="doctors" element={<Doctors selectedBranch={selectedBranch} />} />
            <Route path="agents" element={<Agents selectedBranch={selectedBranch} />} />

            {/* ✅ Lab (Master) */}
            
            <Route path="all-reports" element={<AdminAllReports selectedBranch={selectedBranch} />} />
            <Route path="today-reports" element={<TodaysAdminreports selectedBranch={selectedBranch} />} />
            <Route path="test-database" element={<TestDatabase selectedBranch={selectedBranch} />} />
            <Route path="test-categories" element={<TestCategories selectedBranch={selectedBranch} />} />
            <Route path="test-panels" element={<TestPanels selectedBranch={selectedBranch} />} />
            <Route path="test-packages" element={<TestPackages selectedBranch={selectedBranch} />} />
            <Route path="interpretations" element={<Interpretations selectedBranch={selectedBranch} />} />
            <Route path="preferred-test" element={<PreferredTest selectedBranch={selectedBranch} />} />
            <Route
              path="approve-branch-test"
              element={<ApproveBranch selectedBranch={selectedBranch} />}
            />

            {/* ✅ Reports */}
            <Route path="report-temp" element={<ReportTemplates selectedBranch={selectedBranch} />} />
            <Route path="bills" element={<Bills selectedBranch={selectedBranch} />} />
            <Route path="letter" element={<Letterhead selectedBranch={selectedBranch} />} />
            <Route path="signatures" element={<Signatures selectedBranch={selectedBranch} />} />
            <Route path="view-report/:reportId" element={<AdminViewReport selectedBranch={selectedBranch} />} />

            {/* ✅ Data Transfer */}
            <Route path="export-data" element={<ExportData selectedBranch={selectedBranch} />} />
            <Route
              path="multi-branch-export"
              element={<MultiExport selectedBranch={selectedBranch} />}
            />
            <Route path="backup" element={<Backup selectedBranch={selectedBranch} />} />
            <Route path="export-logs" element={<ExportLogs selectedBranch={selectedBranch} />} />

            {/* ✅ Branch Management */}
            <Route path="branches" element={<AllBranch selectedBranch={selectedBranch} />} />
            <Route path="add-branch" element={<AddBranch selectedBranch={selectedBranch} />} />
            <Route path="edit-branch/:id" element={<EditBranch selectedBranch={selectedBranch} />} />
            <Route path="delete-branch" element={<DeleteBranch selectedBranch={selectedBranch} />} />

            {/* ✅ New Case */}
            <Route path="new-case" element={<AdminNewCase selectedBranch={selectedBranch} />} />
            <Route path="edit-case/:id" element={<EditAdminCase selectedBranch={selectedBranch} />} />
            <Route path="bill/:reportId" element={<AdminBillPage selectedBranch={selectedBranch} />} />

            {/* ✅ Secondary Pages (Manual Additions) */}
            <Route path="add-test-manually" element={<AddTestManually selectedBranch={selectedBranch} />} />
            <Route path="single-parameter" element={<Singlepara selectedBranch={selectedBranch} />} />
            <Route path="multiple-parameters" element={<Multiplepara selectedBranch={selectedBranch} />} />
            <Route path="nested-parameters" element={<Nestedpara selectedBranch={selectedBranch} />} />
            <Route path="document" element={<Documentpara selectedBranch={selectedBranch} />} />
            <Route path="new-category" element={<NewCategory selectedBranch={selectedBranch} />} />
            <Route path="edit-category/:id" element={<EditCategory selectedBranch={selectedBranch} />} />
            <Route path="add-panel" element={<AddTestPanel selectedBranch={selectedBranch} />} />
            <Route path="add-package" element={<AddTestPackage selectedBranch={selectedBranch} />} />
            <Route path="edit-test/single/:id" element={<EditSinglepara selectedBranch={selectedBranch} />} />
            <Route path="edit-test/multi/:id" element={<EditMultiplepara selectedBranch={selectedBranch} />} />
            <Route path="edit-test/nested/:id" element={<EditNestedpara selectedBranch={selectedBranch} />} />
            <Route path="edit-test/document/:id" element={<EditDocumentpara selectedBranch={selectedBranch} />} />
            <Route path="edit-panel/:id" element={<EditPanels selectedBranch={selectedBranch} />} />
            <Route path="edit-package/:id" element={<EditPackage selectedBranch={selectedBranch} />} />
            <Route path="test-values/:id" element={<EditValues selectedBranch={selectedBranch} />} />
            <Route path="test-view/:id" element={<TestView selectedBranch={selectedBranch} />} />
            <Route path="add-letter" element={<AddLetterhead selectedBranch={selectedBranch} />} />
            <Route path="add-signature" element={<AddSignature selectedBranch={selectedBranch} />} />
            <Route path="enter-result/:reportId" element={<AdminEnterResults selectedBranch={selectedBranch} />} />
            <Route path="edit-result/:reportId" element={<AdminEditResult selectedBranch={selectedBranch} />} />
            <Route path="print-settings/:reportId" element={<AdminPrintSetting selectedBranch={selectedBranch} />} />
            <Route path="msg-temp" element={<WhatsappTemplates selectedBranch={selectedBranch} />} />
            <Route path="rate-list" element={<RateList selectedBranch={selectedBranch} />} />
            
          </Routes>
        </div>


      </div>
    </div>
  )
}

export default AdminHome
