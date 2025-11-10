import React, { useContext, useEffect, useState } from 'react'
import { LabContext } from '../../context/LabContext';
import axios from 'axios';

const AdminNavbar = () => {

    const { selectedBranch, setAdminToken, navigate, setSelectedBranch, isOpen, setIsOpen, showside, setshowside, adminToken, successToast, errorToast, totalRevenue } = useContext(LabContext)

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

        const logout = ()=>{
                setAdminToken("")
                navigate("/admin-login")
                successToast("Logged Out")
        }

  




    const [showanother, setshowanother] = useState(false)

    return (
        <div className='w-full px-5 py-5  border-b flex justify-between border-gray-300 sticky top-0 z-50 bg-white print:hidden'>
            <div className='flex gap-20 w-full'>
                <div className='flex items-center gap-2'>
                    
                    <div onClick={() => setshowside(true)} className='flex items-center md:hidden print:hidden'>
                        <img src="/menu-lims.png" className='w-9 cursor-pointer' alt="" />
                    </div>

                    <div className='flex gap-2 items-center'>
                        <img src="/slhlogo-bg.png" className='w-20' alt="Logo" />
                        <div className='flex flex-col '>
                            <p className='text-primary text-xl roboto-second whitespace-nowrap'>SLH</p>
                            <p className='text-gray-600 -mt-1 text-sm whitespace-nowrap'>LAB YOUR WAY</p>
                        </div>
                    </div>
                </div>


                <select
                    name="branch"
                    value={selectedBranch || ""}
                    onChange={(e) => setSelectedBranch(e.target.value || null)}
                    className="border h-10 mt-3 p-2 rounded-md hidden md:block"
                >
                    <option value="">All</option>
                    {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                            {b.name} ({b.place})
                        </option>
                    ))}
                </select>



                {/* Search Bar */}
                <div className="md:flex hidden items-center mt-3   pl-3 gap-2 bg-[#F1F5F9] h-[40px] rounded-md overflow-hidden w-full max-w-3xl">


                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 30 30" fill="#6B7280">
                        <path d="M13 3C7.489 3 3 7.489 3 13s4.489 10 10 10a9.95 9.95 0 0 0 6.322-2.264l5.971 5.971a1 1 0 1 0 1.414-1.414l-5.97-5.97A9.95 9.95 0 0 0 23 13c0-5.511-4.489-10-10-10m0 2c4.43 0 8 3.57 8 8s-3.57 8-8 8-8-3.57-8-8 3.57-8 8-8" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search for Cases"
                        className="w-full h-full outline-none text-gray-500 placeholder-gray-500 text-sm"
                    />
                </div>


            </div>

            <div className='flex items-center md:gap-5 gap-5'>
                <div className='flex items-center md:hidden'>
                    <img src="/search.png" className=' w-10 cursor-pointer' alt="" />
                </div>
                <div >
                    <img onClick={()=> setIsOpen(true)} src="/bell.png" className='md:w-7  w-10 cursor-pointer' alt="" />
                </div>
                <div
                    className={`relative `}

                    onMouseEnter={() => window.innerWidth >= 768 && setshowanother(true)}
                    onMouseLeave={() => window.innerWidth >= 768 && setshowanother(false)}>

                    <img src="/user-lims.png" className='md:w-7  w-10 cursor-pointer'
                        onClick={() => {
                            if (window.innerWidth < 768) setshowanother(!showanother);
                        }} alt="" />

                    <div
                        className={`absolute right-0 pt-4 z-40 ${showanother ? 'block' : 'hidden'}`}
                    >
                        <div className='flex flex-col gap-2 w-70  bg-white border border-gray-300 text-gray-500 rounded'>
                            <div className='border-b border-gray-300 py-3 px-5'>
                                <p className='whitespace-nowrap text-black roboto-second text-xl'>Sanjay Diagnostics</p>
                                <button className='rounded bg-[#10B981] px-2 text-center text-white text-sm'>Account Owner</button>
                            </div>
                            <div className='flex gap-2 items-center border-b  border-gray-300 py-2 px-5'>
                                <img src="/rupee.png" className='w-5 h-5' alt="" />
                                <p className='text-primary font-bold text-sm whitespace-nowrap'>Today's total: Rs{totalRevenue.toLocaleString()}</p>

                            </div>

                            

                            <div onClick={logout} className='flex gap-2 items-center px-5 border-b border-t border-gray-300 py-2  cursor-pointer'>
                                <img src="/exit.png" className='w-6 h-6' alt="" />
                                <p className='text-secondary roboto-second hover:text-black transition'>Log Out</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminNavbar
