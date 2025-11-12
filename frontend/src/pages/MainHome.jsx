import React, { useContext, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Route, Routes, useParams } from 'react-router-dom'
import Dashboard from './Dashboard'

import AllCases from './cases/AllCases'

import Transactions from './cases/Transactions'
import Doctors from './cases/Doctors'
import Agents from './cases/Agents'
import Todaysreports from './lab/Todaysreports'
import AllReports from './lab/AllReports'
import TestPackages from './lab/TestPackages'
import TestPanels from './lab/TestPanels'
import TestDatabase from './lab/TestDatabase'
import TestCatagories from './lab/TestCatagories'
import ReportTemplates from './report/ReportTemplates'
import Signatures from './report/Signatures'
import Bills from './report/Bills'
import NewCase from './NewCase'

import Singlepara from './lab/Singlepara'
import Multiplepara from './lab/Multiplepara'
import Nestedpara from './lab/Nestedpara'
import Documentpara from './lab/Documentpara'
import Interpretations from './lab/Interpretations'
import PreferredTest from './lab/PreferredTest'
import Analytics from './buisness/Analytics'
import NewCategory from './lab/NewCatagory'
import AddTestPanel from './lab/AddTestPanel'
import AddTestPackage from './lab/AddTestPackage'
import { LabContext } from '../context/LabContext'
import LetterHead from './report/LetterHead'
import EditCase from './EditCase'
import BillPage from './report/BillPage'
import EnterResults from './report/EnterResults'
import ViewReport from './report/ViewReport'
import EditResult from './report/EditResult'
import PrintSettings from './report/PrintSettings'
import AddTestManually from './lab/AddTestManually'
import BranchTestView from './lab/BranchTestView'
import RateList from './lab/RateList'

const MainHome = () => {
    const { branchId } = useParams()

    const { branchToken, navigate} = useContext(LabContext)

    

    return (
        <div>
            <Navbar branchId={branchId}/>
            <div className='flex w-full'>
            <Sidebar branchId={branchId}/>

            <div className='md:w-[86%] w-full ml-auto '>
          <Routes>
        <Route path='dashboard' element={<Dashboard branchId={branchId}/>}/>
        <Route path='analytics' element={<Analytics branchId={branchId}/>}/>
        <Route path='all-cases' element={<AllCases branchId={branchId}/>}/>
        <Route path='transactions' element={<Transactions branchId={branchId}/>}/>
        <Route path='doctors' element={<Doctors branchId={branchId}/>}/>
        <Route path='agents' element={<Agents branchId={branchId}/>}/>
        <Route path='today-reports' element={<Todaysreports branchId={branchId}/>}/>
        <Route path='all-reports' element={<AllReports branchId={branchId}/>}/>
        <Route path='interpretations' element={<Interpretations branchId={branchId}/>}/>
        <Route path='preferred-test' element={<PreferredTest branchId={branchId}/>}/>
        <Route path='packages' element={<TestPackages branchId={branchId}/>}/>
        <Route path='panels' element={<TestPanels branchId={branchId}/>}/>
        <Route path='database' element={<TestDatabase branchId={branchId}/>}/>
        <Route path='catagories' element={<TestCatagories branchId={branchId}/>}/>
        <Route path='report-temp' element={<ReportTemplates branchId={branchId}/>}/>
        <Route path='signatures' element={<Signatures branchId={branchId}/>}/>
        <Route path='bills' element={<Bills branchId={branchId}/>}/>
        <Route path='letter' element={<LetterHead branchId={branchId}/>}/>
        <Route path='new-case' element={<NewCase branchId={branchId}/>}/>
        <Route path='edit-case/:id' element={<EditCase branchId={branchId}/>}/>
        <Route path='bill/:id' element={<BillPage branchId={branchId}/>}/>
        <Route path='enter-result/:reportId' element={<EnterResults branchId={branchId}/>}/>
        <Route path='edit-result/:reportId' element={<EditResult branchId={branchId}/>}/>
        <Route path='view-report/:reportId' element={<ViewReport branchId={branchId}/>}/>
        <Route path='print-settings/:reportId' element={<PrintSettings branchId={branchId}/>}/>
        <Route path='test-view-branch/:id' element={<BranchTestView branchId={branchId}/>}/>
        <Route path='rate-list' element={<RateList branchId={branchId}/>}/>

        {/* second */}

        <Route path='add-test-manually' element={<AddTestManually branchId={branchId}/>}/>
        <Route path='single-parameter' element={<Singlepara branchId={branchId}/>}/>
        <Route path='multiple-parameters' element={<Multiplepara branchId={branchId}/>}/>
        <Route path='nested-parameters' element={<Nestedpara branchId={branchId}/>}/>
        <Route path='document' element={<Documentpara branchId={branchId}/>}/>
        <Route path='new-category' element={<NewCategory branchId={branchId}/>}/>
        <Route path='add-panel' element={<AddTestPanel branchId={branchId}/>}/>
        <Route path='add-package' element={<AddTestPackage branchId={branchId}/>}/>
        

        </Routes>

        </div>
        </div>
        </div>
    )
}

export default MainHome
