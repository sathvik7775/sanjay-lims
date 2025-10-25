import React from 'react'

const Loader = () => {
  return (
    <div className="fixed inset-0  z-50 flex items-center justify-center">
        <img src="/loading.gif" className='w-20 h-20' alt="" />
      
    </div>
  )
}

export default Loader
