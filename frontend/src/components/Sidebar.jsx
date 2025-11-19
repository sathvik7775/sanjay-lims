import React, { useContext, useState } from 'react'
import { LabContext } from '../context/LabContext'
import { Link } from 'react-router-dom'

const Sidebar = ({branchId}) => {

    const { visible, setvisible, navigate,  } = useContext(LabContext)

    const [first, setfirst] = useState(false)
    const [second, setsecond] = useState(false)
    const [third, setthird] = useState(false)
    const [fourth, setfourth] = useState(false)
    const [fifth, setfifth] = useState(false)
    const [sixth, setsixth] = useState(false)

    return (
        <div>
            <div className='w-[14%] hidden bg-[#F9FAFB] min-h-screen  fixed border-r border-gray-300 px-2 py-3 md:flex flex-col items-start print:hidden'>
                <button onClick={()=> {navigate(`/${branchId}/new-case`)
                    scrollTo(0, 0)
                }} className='px-10 py-2 cursor-pointer flex items-center gap-2 text-white roboto-third bg-primary rounded-3xl hover:bg-primary-dark transition '><span className='text-xl -mt-1'>+</span><span
                    className='text-[15px] whitespace-nowrap'>New Bill</span></button>
                <div className='flex flex-col items-start justify-start mt-5 w-full h-[80vh] scrollable-container overflow-y-auto overflow-x-hidden'>

                    <Link to={`/${branchId}/dashboard`} className='flex gap-2 items-center rounded py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full active:bg-primary/23'>
                        <img src="/home-lims.png" className='w-4 h-4' alt="" />
                        <p className='text-secondary roboto-third'>Dashboard</p>
                    </Link>

                    <div className='w-full'>
                        <div
                            onClick={() => setfirst(prev => !prev)}
                            className='flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                            <div className='flex gap-2 items-center'>
                                <img src="/bar-chart.png" className='w-4 h-4' alt="" />
                                <p className='text-secondary roboto-third'>Business</p>
                            </div>
                            <img src="/down-lims.png" className='w-4 h-4' alt="" />
                        </div>

                        <div className={`mx-3 mt-3 ${first ? 'flex' : 'hidden'} flex-col transition w-full`}>
                            <Link to={`/${branchId}/analytics`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/analitycs.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px]'>Analytics</p>
                            </Link>
                        </div>
                    </div>

                    <div className='w-full'>
                        <div
                            onClick={() => setsecond(prev => !prev)}
                            className='flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                            <div className='flex gap-2 items-center'>
                                <img src="/case.png" className='w-4 h-4' alt="" />
                                <p className='text-secondary roboto-third'>Cases</p>
                            </div>
                            <img src="/down-lims.png" className='w-4 h-4' alt="" />
                        </div>

                        <div className={`mx-3 mt-3 ${second ? 'flex' : 'hidden'} flex-col transition w-full`}>
                            <Link to={`/${branchId}/all-cases`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/list.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>All cases</p>
                            </Link>
                           
                            
                            <Link to={`/${branchId}/transactions`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/transactional-data.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Transactions</p>
                            </Link>
                            <Link to={`/${branchId}/doctors`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/stethoscope.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Referel Doctors</p>
                            </Link>
                            <Link to={`/${branchId}/agents`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/realtor.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Agents</p>
                            </Link>
                        </div>
                    </div>

                    <div className='w-full'>
                        <div
                            onClick={() => setthird(prev => !prev)}
                            className='flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                            <div className='flex gap-2 items-center'>
                                <img src="/test-tube.png" className='w-4 h-4' alt="" />
                                <p className='text-secondary roboto-third'>Lab</p>
                            </div>
                            <img src="/down-lims.png" className='w-4 h-4' alt="" />
                        </div>

                        <div className={`mx-3 mt-3 ${third ? 'flex' : 'hidden'} flex-col transition w-full`}>
                            
                            <Link to={`/${branchId}/today-reports`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/report.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Today's Reports</p>
                            </Link>
                            <Link to={`/${branchId}/all-reports`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/list.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>All Reports</p>
                            </Link>
                            <Link to={`/${branchId}/packages`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/package-box.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Test Packages</p>
                            </Link>
                            <Link to={`/${branchId}/panels`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/boxes.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Test Panels</p>
                            </Link>
                            <Link to={`/${branchId}/catagories`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/menu-2.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Test Departments</p>
                            </Link>
                            <Link to={`/${branchId}/database`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/server.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Test database</p>
                            </Link>
                            <Link to={`/${branchId}/rate-list`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/credit-card.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>RateList</p>
                            </Link>
                            <Link to={`/${branchId}/interpretations`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/i.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Interpretations</p>
                            </Link>
                            

                        </div>
                    </div>

                    

                    

                    <div className='w-full'>
                        <div
                            onClick={() => setsixth(prev => !prev)}
                            className='flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                            <div className='flex gap-2 items-center'>
                                <img src="/add-task.png" className='w-4 h-4' alt="" />
                                <p className='text-secondary roboto-third'>Reports</p>
                            </div>
                            <img src="/down-lims.png" className='w-4 h-4' alt="" />
                        </div>

                        <div className={`mx-3 mt-3 ${sixth ? 'flex' : 'hidden'} flex-col transition w-full`}>
                            <Link to={`/${branchId}/report-temp`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/report.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Report templates</p>
                            </Link>
                            
                            <Link to={`/${branchId}/letter`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/letter.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Letter Head</p>
                            </Link>
                            <Link to={`/${branchId}/signatures`} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/signature.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Signatures</p>
                            </Link>
                        </div>
                    </div>




                </div>
            </div>

            {visible &&
                <div className='w-full md:hidden bg-[#F9FAFB] min-h-screen  fixed z-50 border-r border-gray-300 px-2 py-3 flex flex-col items-start '>
                    <div className='flex justify-between items-center w-full'>
                        <div>
                            <button className='px-10 py-2 cursor-pointer flex items-center gap-2 text-white roboto-third bg-primary rounded-3xl hover:bg-primary-dark transition'>
                                <span className='text-xl -mt-1'>+</span>
                                <span className='text-[15px] whitespace-nowrap'>New Bill</span>
                            </button>
                        </div>
                        <img src="/back.png" className='w-7 h-7' onClick={()=> setvisible(false)} alt="Back icon" />
                    </div>

                    <div className='flex flex-col items-start justify-start mt-5 w-full h-[80vh] scrollable-container overflow-y-auto overflow-x-hidden'>

                        <Link to={`/${branchId}/dashboard`} onClick={()=> setvisible(false)} className='flex gap-2 items-center rounded py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                            <img src="/home-lims.png" className='w-4 h-4' alt="" />
                            <p className='text-secondary roboto-third'>Dashboard</p>
                        </Link>

                        <div className='w-full'>
                            <div
                                onClick={() => setfirst(prev => !prev)}
                                className='flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                                <div className='flex gap-2 items-center'>
                                    <img src="/bar-chart.png" className='w-4 h-4' alt="" />
                                    <p className='text-secondary roboto-third'>Business</p>
                                </div>
                                <img src="/down-lims.png" className='w-4 h-4' alt="" />
                            </div>

                            <div className={`mx-3 mt-3 ${first ? 'flex' : 'hidden'} flex-col transition w-full`}>
                                <Link to={`/${branchId}/analytics`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                    <img src="/analitycs.png" className='w-5 h-5' alt="" />
                                    <p className='text-secondary roboto-third text-[15px]'>Analytics</p>
                                </Link>
                            </div>
                        </div>

                        <div className='w-full'>
                            <div
                                onClick={() => setsecond(prev => !prev)}
                                className='flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                                <div className='flex gap-2 items-center'>
                                    <img src="/case.png" className='w-4 h-4' alt="" />
                                    <p className='text-secondary roboto-third'>Cases</p>
                                </div>
                                <img src="/down-lims.png" className='w-4 h-4' alt="" />
                            </div>

                            <div className={`mx-3 mt-3 ${second ? 'flex' : 'hidden'} flex-col transition w-full`}>
                            <Link to={`/${branchId}/all-cases`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/list.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>All cases</p>
                            </Link>
                            
                            
                            <Link to={`/${branchId}/transactions`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/transactional-data.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Transactions</p>
                            </Link>
                            <Link to={`/${branchId}/doctors`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/stethoscope.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Referel Doctors</p>
                            </Link>
                            <Link to={`/${branchId}/agents`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/realtor.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Agents</p>
                            </Link>
                        </div>
                        </div>

                        <div className='w-full'>
                            <div
                                onClick={() => setthird(prev => !prev)}
                                className='flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                                <div className='flex gap-2 items-center'>
                                    <img src="/test-tube.png" className='w-4 h-4' alt="" />
                                    <p className='text-secondary roboto-third'>Lab</p>
                                </div>
                                <img src="/down-lims.png" className='w-4 h-4' alt="" />
                            </div>

                            <div className={`mx-3 mt-3 ${third ? 'flex' : 'hidden'} flex-col transition w-full`}>
                            
                            <Link to={`/${branchId}/today-reports`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/report.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Today's Reports</p>
                            </Link>
                            <Link to={`/${branchId}/all-reports`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/list.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>All Reports</p>
                            </Link>
                            <Link to={`/${branchId}/packages`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/package-box.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Test Packages</p>
                            </Link>
                            <Link to={`/${branchId}/panels`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/boxes.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Test Panels</p>
                            </Link>
                            <Link to={`/${branchId}/catagories`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/menu-2.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Test Departments</p>
                            </Link>
                            <Link to={`/${branchId}/database`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/server.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Test database</p>
                            </Link>
                            <Link to={`/${branchId}/rate-list`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/credit-card.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>RateList</p>
                            </Link>
                            <Link to={`/${branchId}/interpretations`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/i.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Interpretations</p>
                            </Link>
                            

                        </div>
                        </div>

                        

                        

                        <div className='w-full'>
                            <div
                                onClick={() => setsixth(prev => !prev)}
                                className='flex gap-2 items-center justify-between rounded mt-2 py-2 px-3 hover:bg-[#E5E7EB] cursor-pointer w-full'>
                                <div className='flex gap-2 items-center'>
                                    <img src="/add-task.png" className='w-4 h-4' alt="" />
                                    <p className='text-secondary roboto-third'>Reports</p>
                                </div>
                                <img src="/down-lims.png" className='w-4 h-4' alt="" />
                            </div>

                            <div className={`mx-3 mt-3 ${sixth ? 'flex' : 'hidden'} flex-col transition w-full`}>
                            <Link to={`/${branchId}/report-temp`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/report.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Report templates</p>
                            </Link>
                            
                            <Link to={`/${branchId}/letter`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/letter.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Letter Head</p>
                            </Link>
                            <Link to={`/${branchId}/signatures`} onClick={()=> setvisible(false)} className='flex gap-2 items-center cursor-pointer hover:bg-[#E5E7EB] px-3 rounded py-2'>
                                <img src="/signature.png" className='w-5 h-5' alt="" />
                                <p className='text-secondary roboto-third text-[15px] whitespace-nowrap'>Signatures</p>
                            </Link>
                        </div>
                        </div>




                    </div>
                </div>
            }
        </div>
    )
}

export default Sidebar
