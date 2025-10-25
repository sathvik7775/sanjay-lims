import React, { useContext } from 'react';
import { Link } from 'react-router-dom';  // Import the Link component
import { LabContext } from '../../context/LabContext';

const AddTestManually = () => {

  const {branchId, adminToken} = useContext(LabContext)

  const single = adminToken ? "/admin/single-parameter" : `/${branchId}/single-parameter`;
  const multi = adminToken ? "/admin/multiple-parameters" : `/${branchId}/multiple-parameters`;
  const nest = adminToken ? "/admin/nested-parameters" : `/${branchId}/nested-parameters`;
  const document = adminToken ? "/admin/document" : `/${branchId}/document`;
  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-10">
      <h1 className="text-2xl font-semibold text-center mb-6">Add Test Manually</h1>
      <p className="text-center text-gray-500 mb-6">Select the type of test result</p>
      <ul className="space-y-4">
        <li className="p-4 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-300 cursor-pointer">
          <Link to={single} className="block">
            <span className="font-bold text-lg">1. Single parameter</span>
            <p className="text-sm text-gray-600">Eg. HB, TLC</p>
          </Link>
        </li>
        <li className="p-4 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-300 cursor-pointer">
          <Link to={multi} className="block">
            <span className="font-bold text-lg">2. Multiple parameters</span>
            <p className="text-sm text-gray-600">Eg. DLC, Blood group</p>
          </Link>
        </li>
        <li className="p-4 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-300 cursor-pointer">
          <Link to={nest} className="block">
            <span className="font-bold text-lg">3. Multiple nested parameters</span>
            <p className="text-sm text-gray-600">Eg. Urine routine, Semen Examination</p>
          </Link>
        </li>
        <li className="p-4 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-300 cursor-pointer">
          <Link to={document} className="block">
            <span className="font-bold text-lg">4. Document</span>
            <p className="text-sm text-gray-600">Eg. FNAC, histo-pathology reports, culture and sensitivity reports</p>
          </Link>
        </li>
      </ul>
      <div className="text-center text-sm text-gray-500 mt-6">
        <p>© 2025 Test Management System</p>
      </div>
    </div>
  );
}

export default AddTestManually;
