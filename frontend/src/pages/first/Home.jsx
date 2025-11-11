import React, { useContext } from 'react'
import { LabContext } from '../../context/LabContext'

const Home = () => {
  const {navigate} = useContext(LabContext)
  return (
    <div 
  className="h-screen flex flex-col bg-cover bg-center" 
  style={{ backgroundImage: "url('/bg-2.jpg')" }}
>
  {/* Top bar */}
  <div className="w-full md:border-b px-12 flex justify-between items-center border-gray-400 bg-white md:bg-white/70 ">
    {/* Logo */}
    <div>
      <img src="/slhlogo-bg.png" className="w-26 h-26 object-contain" alt="Company Logo" />
    </div>

    {/* Login buttons */}
    <div className="md:flex gap-5 hidden">
      <button onClick={()=> navigate('/branch-login')} className="px-4 py-2 rounded cursor-pointer bg-primary text-white shadow hover:bg-primary/85 transition">
        Login as Branch
      </button>
      <button onClick={()=> navigate('/admin-login')} className="px-4 py-2 rounded cursor-pointer bg-primary text-white shadow hover:bg-primary/85 transition">
        Login as Admin
      </button>
    </div>
  </div>

  <div className='w-full h-full flex flex-col  justify-center md:px-72 px-3'>
    <div>
    <h1 className=' text-gray-500 text-6xl roboto-second'>SLH's</h1>
    <h1 className='text-white text-6xl roboto-second'>LAB MANAGEMENT</h1>
    <h1 className='text-white text-6xl roboto-second'>SOFTWARE</h1>
    </div>

    <div className="flex items-center justify-center md:items-start md:justify-start gap-5 mt-7">
      <button onClick={()=> navigate('/branch-login')} className="px-4 py-2 rounded cursor-pointer bg-primary text-white shadow hover:bg-primary/85 transition">
        Login as Branch
      </button>
      <button onClick={()=> navigate('/admin-login')} className="px-4 py-2 rounded cursor-pointer bg-primary text-white shadow hover:bg-primary/85 transition">
        Login as Admin
      </button>
    </div>
  </div>
</div>

  )
}

export default Home
