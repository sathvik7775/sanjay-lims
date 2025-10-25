import React, { useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/first/Home'
import BranchLogin from './pages/first/BranchLogin'
import AdminLogin from './pages/first/AdminLogin'
import MainHome from './pages/MainHome'
import { LabContext } from './context/LabContext'
import Dashboard from './pages/Dashboard'
import AdminHome from './pages/admin/AdminHome'
import { Toaster } from 'react-hot-toast'

const App = () => {
  const {branchId, setBranchId, navigate} = useContext(LabContext)
  return (
    <div>
      <Toaster/>
      
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/branch-login' element={<BranchLogin/>}/>
        <Route path='/admin-login' element={<AdminLogin/>}/>
        <Route path='/:branchId/*' element={<MainHome/>}/>
        <Route path='/admin/*' element={<AdminHome/>}/>
        <Route path='/' element={<Home/>}/>
        <Route path='/' element={<Home/>}/>
        <Route path='/' element={<Home/>}/>
        <Route path='/' element={<Home/>}/>
        <Route path='/' element={<Home/>}/>
        <Route path='/' element={<Home/>}/>
      </Routes>
      
    </div>
  )
}

export default App
