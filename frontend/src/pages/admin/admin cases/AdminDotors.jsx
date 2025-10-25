import React, { useContext } from 'react'
import { LabContext } from '../../../context/LabContext'
import { Plus } from 'lucide-react'

const AdminDotors = () => {
  const {doctors} = useContext(LabContext)

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Referral Doctors
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-sm text-gray-700">
            <tr>
              <th className="py-3 px-4 border-b text-left font-medium">ID</th>
              <th className="py-3 px-4 border-b text-left font-medium">
                Registered On
              </th>
              <th className="py-3 px-4 border-b text-left font-medium">Name</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-gray-50 text-sm transition"
              >
                <td className="py-3 px-4 border-b">{doc.id}</td>
                <td className="py-3 px-4 border-b">{doc.regOn}</td>
                <td className="py-3 px-4 border-b">{doc.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDotors
