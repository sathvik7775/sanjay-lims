
import React, { useState, useContext } from 'react';
import { Editor } from "@tinymce/tinymce-react";
import axios from 'axios';
import { LabContext } from '../../context/LabContext';
import Loader from '../../components/Loader';

const Nestedpara = () => {
  const { errorToast, successToast, branchId, adminToken, branchToken, categories } = useContext(LabContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    category: '',
    price: '',
    method: '',
    instrument: '',
    interpretation: '',
    parameters: [
      { id: 1, order: 1, name: '', unit: '', inputType: 'Single Line', groupBy: '', defaultResult: '', isOptional: false },
      { id: 2, order: 2, name: '', unit: '', inputType: 'Single Line', groupBy: '', defaultResult: '', isOptional: false },
    ],
    isFormula: false, // Add isFormula to the state
    addToRateList: true,

});

  const handleInputChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    const updatedParameters = [...formData.parameters];
    updatedParameters[index][name] = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, parameters: updatedParameters });
  };

  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,  // Handles checkbox value
  }));
};


  const handleTestDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddParameter = () => {
    const newId = Math.max(...formData.parameters.map(p => p.id), 0) + 1;
    const newParameter = { id: newId, order: newId, name: '', unit: '', inputType: 'Single Line', groupBy: '', defaultResult: '', isOptional: false };
    setFormData({ ...formData, parameters: [...formData.parameters, newParameter] });
  };

  const handleRemoveParameter = (index) => {
    const updatedParameters = formData.parameters.filter((_, i) => i !== index);
    setFormData({ ...formData, parameters: updatedParameters });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
  errorToast?.("Please enter a test name");
  return;
}




    if (!adminToken && !branchToken) {
      errorToast?.("Unauthorized! Please log in.");
      return;
    }

    try {
      setLoading(true);

      let url = "";
      let headers = {};
      const payload = {
        name: formData.name,
        shortName: formData.shortName,
        type: "nested", // multi-parameter test
        category: formData.category,
        price: Number(formData.price),
        method: formData.method,
        instrument: formData.instrument,
        interpretation: formData.interpretation,
        parameters: formData.parameters.map((param) => ({
          name: param.name || formData.name,
          shortName: param.shortName,
          unit: param.unit,
          inputType: param.inputType,
          groupBy: param.groupBy,
          defaultResult: param.defaultResult,
          isOptional: param.isOptional,
        })),
        isFormula: formData.isFormula, 
        addToRateList: formData.addToRateList,

      };

      if (adminToken) {
        url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/add`;
        headers = { Authorization: `Bearer ${adminToken}` };
      } else if (branchToken) {
        if (!branchId) {
          errorToast?.("Branch ID missing! Cannot create request.");
          setLoading(false);
          return;
        }
        url = `${import.meta.env.VITE_API_URL}/api/test/database/add`;
        headers = { Authorization: `Bearer ${branchToken}` };
        payload.branchId = branchId;
      }

      const res = await axios.post(url, payload, { headers });

      if (res.data.success) {
        successToast?.(adminToken ? "Test added globally!" : "Test request sent for approval!");
        // Reset form
        setFormData({
          name: '',
          shortName: '',
          category: '',
          price: '',
          method: '',
          instrument: '',
          interpretation: '',
          parameters: [
            { id: 1, order: 1, name: '', unit: '', inputType: 'Single Line', groupBy: '', defaultResult: '', isOptional: false },
            { id: 2, order: 2, name: '', unit: '', inputType: 'Single Line', groupBy: '', defaultResult: '', isOptional: false },
          ],
        isFormula: false,

        });
      } else {
        errorToast?.(res.data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Error adding test:", err);
      errorToast?.("Failed to save test");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="w-full p-8 bg-white rounded-lg shadow-lg mt-10">
      <h1 className="text-2xl font-semibold text-center mb-6">New Test (Nested Parameters)</h1>
      
        <form onSubmit={handleSubmit}>
        {/* Test Details Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label htmlFor="name" className="block text-sm font-semibold">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleTestDetailsChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="col-span-1">
              <label htmlFor="shortName" className="block text-sm font-semibold">Short Name</label>
              <input
                type="text"
                id="shortName"
                name="shortName"
                value={formData.shortName}
                onChange={handleTestDetailsChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
  <label className="block text-sm mb-1">Category</label>
  <input
    list="categories"
    name="category"
    value={formData.category}
    onChange={handleTestDetailsChange}
    className="w-full border border-gray-300 rounded-lg px-3 py-2"
    placeholder="Select category..."
  />
  <datalist id="categories">
    {categories.map((cat) => (
      <option key={cat._id} value={cat.name} />
    ))}
  </datalist>
</div>

            <div className="col-span-1">
              <label htmlFor="price" className="block text-sm font-semibold">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleTestDetailsChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Parameters Section */}
        <div>
          <h2 className="text-xl font-semibold mt-6 mb-4">Parameters</h2>
          {formData.parameters.map((parameter, index) => (
            <div key={parameter.id} className="grid grid-cols-7 gap-4 mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => handleRemoveParameter(index)}
                  className="text-primary font-semibold hover:underline"
                >
                  Remove
                </button>
                <div>
                  <label htmlFor={`order-${parameter.id}`} className="block text-sm font-semibold">Order</label>
                  <input
                    type="number"
                    id={`order-${parameter.id}`}
                    name="order"
                    value={parameter.order || ''}
                    onChange={(e) => handleInputChange(e, index)}
                    className="w-16 p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`name-${parameter.id}`} className="block text-sm font-semibold">Name</label>
                <input
                  type="text"
                  id={`name-${parameter.id}`}
                  name="name"
                  value={parameter.name}
                  onChange={(e) => handleInputChange(e, index)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor={`unit-${parameter.id}`} className="block text-sm font-semibold">Unit</label>
                <input
                  list="units"
                  id={`unit-${parameter.id}`}
                  name="unit"
                  value={parameter.unit}
                  onChange={(e) => handleInputChange(e, index)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Select unit..."
                />
                <datalist id="units">
                  <option value="%" />
                  <option value="AU/mL" />
                  <option value="cumm" />
                  <option value="fL" />
                  <option value="FL" />
                  <option value="g" />
                  <option value="g/dl" />
                  <option value="gm%" />
                  <option value="/HPF" />
                  <option value="index/mL" />
                  <option value="IU/L" />
                  <option value="µIU/mL" />
                  <option value="IU/mL" />
                  <option value="lakhs/cumm" />
                  <option value="mcg/mg" />
                  <option value="mcL" />
                  <option value="mEq/L" />
                  <option value="mg%" />
                  <option value="mg/dl" />
                  <option value="mg/DL" />
                  <option value="mg/L" />
                  <option value="mg/mL" />
                  <option value="Mill/cml." />
                  <option value="million/cumm" />
                  <option value="min" />
                  <option value="mIU/mL" />
                  <option value="ml" />
                  <option value="mm for 1st hour" />
                  <option value="mmHg" />
                  <option value="mmol/l" />
                  <option value="mmol/L" />
                  <option value="ng/dl" />
                  <option value="ng/I" />
                  <option value="ng/mL" />
                  <option value="nmol/L" />
                  <option value="Pg" />
                  <option value="pg/d" />
                  <option value="pg/ml" />
                  <option value="pg/mL" />
                  <option value="pmol/L" />
                  <option value="seconds" />
                  <option value="Thousand/cumm" />
                  <option value="U/I" />
                  <option value="U/mL" />
                  <option value="x10^9/L" />
                  <option value="μg/24 hrs" />
                  <option value="μg/dl" />
                  <option value="μg FEU/mL" />
                  <option value="μg/mL" />
                  {/* Add more options as needed */}
                </datalist>
              </div>
              <div>
                <label htmlFor={`inputType-${parameter.id}`} className="block text-sm font-semibold">Input Type</label>
                <select
                  id={`inputType-${parameter.id}`}
                  name="inputType"
                  value={parameter.inputType}
                  onChange={(e) => handleInputChange(e, index)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Single Line">Single Line</option>
                  <option value="Numeric">Numeric</option>
                  <option value="Paragraph">Paragraph</option>
                </select>
              </div>
              <div>
                <label htmlFor={`groupBy-${parameter.id}`} className="block text-sm font-semibold">* Group By</label>
                <input
                  type="text"
                  id={`groupBy-${parameter.id}`}
                  name="groupBy"
                  value={parameter.groupBy}
                  onChange={(e) => handleInputChange(e, index)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor={`defaultResult-${parameter.id}`} className="block text-sm font-semibold">Default Result</label>
                <input
                  type="text"
                  id={`defaultResult-${parameter.id}`}
                  name="defaultResult"
                  value={parameter.defaultResult}
                  onChange={(e) => handleInputChange(e, index)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`optional-${parameter.id}`}
                  name="isOptional"
                  checked={parameter.isOptional}
                  onChange={(e) => handleInputChange(e, index)}
                  className="mr-2"
                />
                <label htmlFor={`optional-${parameter.id}`} className="text-sm">Optional</label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddParameter}
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          >
            + Add more parameters
          </button>
        </div>

        {/* Method and Instrument */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="col-span-1">
            <label htmlFor="method" className="block text-sm font-semibold">Method</label>
            <input
              type="text"
              id="method"
              name="method"
              value={formData.method}
              onChange={handleTestDetailsChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="col-span-1">
            <label htmlFor="instrument" className="block text-sm font-semibold">Instrument</label>
            <input
              type="text"
              id="instrument"
              name="instrument"
              value={formData.instrument}
              onChange={handleTestDetailsChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="flex items-center mt-4">
  <input
    type="checkbox"
    name="isFormula"
    checked={formData.isFormula}  // Bind to the formData state
    onChange={handleChange}  // Handle checkbox change
    className="mr-2"
  />
  <label className="text-sm">Is this a formula test?</label>
</div>

<div className="flex items-center mt-2">
  <input
    type="checkbox"
    name="addToRateList"
    checked={formData.addToRateList}
    onChange={handleChange}
    className="mr-2"
  />
  <label className="text-sm">Add to Rate List</label>
</div>



        {/* Interpretation */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Interpretation</label>

          <Editor
  apiKey="0vfv6vlb9kccql8v3on0qtobc8m7irv267colygcsartuoxa"
  value={formData.interpretation}
  init={{
    height: 250,
    menubar: false,
    plugins: [
      "advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor",
      "searchreplace", "visualblocks", "code", "fullscreen",
      "insertdatetime", "media", "table", "help", "wordcount"
    ],
    toolbar:
      "undo redo | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image | code",
    content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }",
    branding: false,
  }}
  onEditorChange={(content) =>
    setFormData((prev) => ({ ...prev, interpretation: content }))
  }
/>

        </div>


        {/* Save Button */}
        <div className="text-center mt-6">
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </form>
      
    </div>
  );
};

export default Nestedpara;
