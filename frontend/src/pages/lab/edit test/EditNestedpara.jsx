import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from "@tinymce/tinymce-react";
import axios from 'axios';
import { LabContext } from '../../../context/LabContext';
import Loader from '../../../components/Loader';

const EditNestedpara = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  parameters: [],
  isFormula: false,
  addToRateList: false, // ✅ Add this line
});

  // Fetch existing test for edit
  useEffect(() => {
    const fetchTest = async () => {
      if (!id) return;
      try {
        setLoading(true);
        let url = '';
        let headers = {};
        if (adminToken) {
          url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${id}`;
          headers = { Authorization: `Bearer ${adminToken}` };
        } else if (branchToken) {
          url = `${import.meta.env.VITE_API_URL}/api/test/database/test/${id}`;
          headers = { Authorization: `Bearer ${branchToken}` };
        }

        const res = await axios.get(url, { headers });
        if (res.data.success && res.data.data) {
          const test = res.data.data;
          setFormData({
            name: test.name || '',
            shortName: test.shortName || '',
            category: test.category || '',
            price: test.price || '',
            method: test.method || '',
            instrument: test.instrument || '',
            interpretation: test.interpretation || '',
            addToRateList: test.addToRateList ?? true,
            isFormula: test.isFormula || false,
            parameters: test.parameters?.map((p, index) => ({
              id: index + 1,
              order: p.order,
              name: p.name,
              shortName: p.shortName,
              unit: p.unit,
              inputType: p.inputType,
              groupBy: p.groupBy,
              defaultResult: p.defaultResult,
              isOptional: p.isOptional,
            })) || [
                { id: 1, order: 1, name: '', unit: '', inputType: 'Single Line', groupBy: '', defaultResult: '', isOptional: false },
                { id: 2, order: 2, name: '', unit: '', inputType: 'Single Line', groupBy: '', defaultResult: '', isOptional: false },
              ],
          });
        } else {
          errorToast?.("Failed to load test details");
        }
      } catch (err) {
        console.error("Error fetching test:", err);
        errorToast?.("Error fetching test details");
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id, adminToken, branchToken]);

  // General form change
  const handleTestDetailsChange = (e) => {
  const { name, value, type, checked } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,  // Handles the checkbox correctly
  }));
};


  // Parameter-specific change
  const handleInputChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    const updatedParameters = [...formData.parameters];
    updatedParameters[index][name] = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, parameters: updatedParameters }));
  };

  const handleAddParameter = () => {
    const newId = Math.max(...formData.parameters.map(p => p.id), 0) + 1;
    const newParameter = { id: newId, order: newId, name: '', unit: '', inputType: 'Single Line', groupBy: '', defaultResult: '', isOptional: false };
    setFormData(prev => ({ ...prev, parameters: [...prev.parameters, newParameter] }));
  };

  const handleRemoveParameter = (index) => {
    const updatedParameters = formData.parameters.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, parameters: updatedParameters }));
  };

  // Submit updated test
  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.name || typeof formData.name !== 'string' || !formData.name.trim()) {
    errorToast?.("Please enter a test name");
    return;
  }

  try {
    setLoading(true);
    const payload = {
      name: formData.name,
      shortName: formData.shortName,
      type: "nested",  // Set the type as "nested"
      category: formData.category,
      price: Number(formData.price),
      method: formData.method,
      instrument: formData.instrument,
      interpretation: formData.interpretation,
      parameters: formData.parameters.map(param => ({
        name: param.name ? param.name : formData.name || "",
        shortName: param.shortName,
        unit: param.unit,
        inputType: param.inputType,
        groupBy: param.groupBy,
        defaultResult: param.defaultResult,
        isOptional: param.isOptional,
      })),
      isFormula: formData.isFormula,  // Add isFormula to the payload
       addToRateList: formData.addToRateList,
    };

    let url = '';
    let headers = {};
    if (adminToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/edit/${id}`;
      headers = { Authorization: `Bearer ${adminToken}` };
    } else if (branchToken) {
      if (!branchId) {
        errorToast?.("Branch ID missing! Cannot update test.");
        setLoading(false);
        return;
      }
      url = `${import.meta.env.VITE_API_URL}/api/test/database/edit/${id}`;
      headers = { Authorization: `Bearer ${branchToken}` };
      payload.branchId = branchId;
    }

    const res = await axios.put(url, payload, { headers });

    if (res.data.success) {
      successToast?.("Test updated successfully!");
      navigate(adminToken ? "/admin/test-database" : "/branch/test-database");
    } else {
      errorToast?.(res.data.message || "Failed to update test");
    }
  } catch (err) {
    console.error("Error updating test:", err);
    errorToast?.("Failed to update test");
  } finally {
    setLoading(false);
  }
};

  if (loading) return <Loader />;

  return (
    <div className="w-full p-8 bg-white rounded-lg shadow-lg mt-10">
      <h1 className="text-2xl font-semibold text-center mb-6">Edit Test (Nested Parameters)</h1>

      <form onSubmit={handleSubmit}>
        {/* Test Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleTestDetailsChange} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-semibold">Short Name</label>
              <input type="text" name="shortName" value={formData.shortName} onChange={handleTestDetailsChange} className="w-full p-2 border border-gray-300 rounded-md" />
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

            <div>
              <label className="block text-sm font-semibold">Price</label>
              <input type="number" name="price" value={formData.price} onChange={handleTestDetailsChange} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Parameters</h2>
          {formData.parameters.map((param, index) => (
            <div key={param.id} className="grid grid-cols-7 gap-4 mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => handleRemoveParameter(index)} className="text-primary font-semibold hover:underline">Remove</button>
                <div>
                  <label className="block text-sm font-semibold">Order</label>
                  <input type="number" name="order" value={param.order || ''} onChange={(e) => handleInputChange(e, index)} className="w-16 p-2 border border-gray-300 rounded-md" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold">Name</label>
                <input type="text" name="name" value={param.name} onChange={(e) => handleInputChange(e, index)} className="w-full p-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label className="block text-sm mb-1">Unit</label>
                <input
                  list="units"
                  name="unit"
                  value={param.unit}
                  onChange={(e) => handleInputChange(e, index)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold">Input Type</label>
                <select name="inputType" value={param.inputType} onChange={(e) => handleInputChange(e, index)} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="Single Line">Single Line</option>
                  <option value="Numeric">Numeric</option>
                  <option value="Paragraph">Paragraph</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold">Group By</label>
                <input type="text" name="groupBy" value={param.groupBy} onChange={(e) => handleInputChange(e, index)} className="w-full p-2 border border-gray-300 rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-semibold">Default Result</label>
                <input type="text" name="defaultResult" value={param.defaultResult} onChange={(e) => handleInputChange(e, index)} className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="isOptional" checked={param.isOptional} onChange={(e) => handleInputChange(e, index)} className="mr-2" />
                <label className="text-sm">Optional</label>
              </div>
              

            </div>
          ))}
          <button type="button" onClick={handleAddParameter} className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">+ Add more parameters</button>
        </div>

        {/* Method & Instrument */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-semibold">Method</label>
            <input type="text" name="method" value={formData.method} onChange={handleTestDetailsChange} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-semibold">Instrument</label>
            <input type="text" name="instrument" value={formData.instrument} onChange={handleTestDetailsChange} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div className="flex items-center mt-4">
  <input
    type="checkbox"
    name="isFormula"
    checked={formData.isFormula}  // Bind the state
    onChange={handleTestDetailsChange}  // Handle change
    className="mr-2"
  />
  <label className="text-sm">Is this a formula test?</label>
</div>

<div className="flex items-center mt-2">
  <input
    type="checkbox"
    name="addToRateList"
    checked={formData.addToRateList}
    onChange={handleTestDetailsChange}
    className="mr-2"
  />
  <label className="text-sm">Add this test to Rate List</label>
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
              plugins: ["advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor",
                "searchreplace", "visualblocks", "code", "fullscreen",
                "insertdatetime", "media", "table", "help", "wordcount"],
              toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image | code",
              content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }",
              branding: false,
            }}
            onEditorChange={(content) => setFormData(prev => ({ ...prev, interpretation: content }))}
          />
        </div>

        {/* Save Button */}
        <div className="text-center mt-6">
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">Save</button>
        </div>
      </form>
    </div>
  );
};

export default EditNestedpara;
