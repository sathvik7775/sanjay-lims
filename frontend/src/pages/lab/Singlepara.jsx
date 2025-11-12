import React, { useContext, useState } from 'react';
import { Editor } from "@tinymce/tinymce-react";
import axios from 'axios';
import { LabContext } from '../../context/LabContext';
import Loader from '../../components/Loader';

const Singlepara = () => {

  const { errorToast, successToast, branchId, adminToken, branchToken, categories } = useContext(LabContext)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    category: "",
    unit: "",
    inputType: "Single Line",
    defaultResult: "",
    isOptional: false,
    price: "",
    method: "",
    instrument: "",
    interpretation: "",
    isFormula: false, // This field was added
    addToRatelist: true,
  });


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

      // Map frontend inputType to backend 'type'
      const testType = "single"; // Single parameter test

      const payload = {
        name: formData.name,
        shortName: formData.shortName,
        type: "single", // Single parameter test
        category: formData.category,
        unit: formData.unit,
        price: Number(formData.price),
        method: formData.method,
        inputType: formData.inputType,
        instrument: formData.instrument,
        isOptional: formData.isOptional,
        interpretation: formData.interpretation,
        isFormula: formData.isFormula, // Add this line
        addToRatelist: formData.addToRatelist, // ✅ NEW FIELD

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
        setFormData({
          name: "",
          shortName: "",
          category: "",
          unit: "",
          inputType: "Single Line",
          defaultResult: "",
          isOptional: false,
          price: "",
          method: "",
          instrument: "",
          interpretation: "",
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


  if (loading) return <Loader />

  return (
    <div className="w-full p-8 bg-white rounded-lg shadow-lg mt-2">
      <h1 className="text-2xl font-semibold text-center mb-6">New Test (Single Parameter)</h1>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Test Name and Short Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label htmlFor="name" className="block text-sm font-semibold">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Category, Unit, Input Type */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Category</label>
              <input
                list="categories"
                name="category"
                value={formData.category}
                onChange={handleChange}
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
              <label className="block text-sm mb-1">Unit</label>
              <input
                list="units"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
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
            <div className="col-span-1">
              <label htmlFor="inputType" className="block text-sm font-semibold">Input Type</label>
              <select
                id="inputType"
                name="inputType"
                value={formData.inputType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Single Line">Single Line</option>
                <option value="Numeric">Numeric</option>
                <option value="Paragraph">Paragraph</option>
              </select>
            </div>
          </div>

          {/* Default Result, Optional, Price */}
          <div className="grid grid-cols-1 gap-4">
            <div className="col-span-1">
              <label htmlFor="defaultResult" className="block text-sm font-semibold">Default Result</label>
              <input
                type="text"
                id="defaultResult"
                name="defaultResult"
                value={formData.defaultResult}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="col-span-1 flex items-center">
              <label htmlFor="isOptional" className="text-sm font-semibold">Optional</label>
              <input
                type="checkbox"
                id="isOptional"
                name="isOptional"
                checked={formData.isOptional}
                onChange={handleChange}
                className="ml-2"
              />
            </div>

            <div className="flex items-center">
              <label className="text-sm font-semibold">Is Formula Test?</label>
              <input
                type="checkbox"
                name="isFormula"
                checked={formData.isFormula}
                onChange={handleChange}
                className="ml-2"
              />
            </div>

            <div className="flex items-center">
  <label className="text-sm font-semibold">Add to Ratelist</label>
  <input
    type="checkbox"
    name="addToRatelist"
    checked={formData.addToRatelist}
    onChange={handleChange}
    className="ml-2"
  />
</div>

            <div className="col-span-1">
              <label htmlFor="price" className="block text-sm font-semibold">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-sm p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>




          {/* Method, Instrument */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label htmlFor="method" className="block text-sm font-semibold">Method</label>
              <input
                type="text"
                id="method"
                name="method"
                value={formData.method}
                onChange={handleChange}
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
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
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
        </div>
      </form>
    </div>
  );
};

export default Singlepara;
