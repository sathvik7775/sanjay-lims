

import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";


const EditSinglepara = () => {
  const { id } = useParams(); // ✅ test id from route (/edit-test/single/:id)
  const navigate = useNavigate();
  const { errorToast, successToast, adminToken, categories } = useContext(LabContext);
  const [loading, setLoading] = useState(false);

  console.log(id);


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
    isFormula: false, // Added field for formula checkbox
    addToRateList: true,

  });


  // ✅ Fetch existing test data
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        if (res.data.success) {
          const test = res.data.data;
          setFormData({
            name: test.name || "",
            shortName: test.shortName || "",
            category: test.category || "",
            unit: test.unit || "",
            inputType: test.inputType || "Single Line",
            defaultResult: test.defaultResult || "",
            isOptional: test.isOptional || false,
            price: test.price || "",
            method: test.method || "",
            instrument: test.instrument || "",
            interpretation: test.interpretation || "",
            isFormula: test.isFormula || false,  // Ensure isFormula is fetched
            addToRateList: test.addToRateList ?? true, // ✅ include this

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

    if (id) fetchTest();
  }, [id]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Submit updated test data
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.name?.trim()) {
    errorToast?.("Please enter a test name");
    return;
  }

  try {
    setLoading(true);

    const payload = {
      name: formData.name,
      shortName: formData.shortName,
      unit: formData.unit,
      type: "single", // single parameter
      category: formData.category,
      price: Number(formData.price),
      method: formData.method,
      instrument: formData.instrument,
      interpretation: formData.interpretation,
      parameters: [], // single param — can be left empty
      isFormula: formData.isFormula, // Include isFormula in the payload
      addToRateList: formData.addToRateList,

    };

    const res = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/test/database/admin/edit/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (res.data.success) {
      successToast?.("Test updated successfully!");
      navigate("/admin/test-database"); // ✅ redirect after saving
    } else {
      errorToast?.(res.data.message || "Update failed");
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
    <div className="w-full p-8 bg-white rounded-lg shadow-lg mt-2">
      <h1 className="text-2xl font-semibold text-center mb-6">
        Edit Test (Single Parameter)
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Test Name and Short Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold">
                Name
              </label>
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
            <div>
              <label htmlFor="shortName" className="block text-sm font-semibold">
                Short Name
              </label>
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
            <div>
              <label htmlFor="inputType" className="block text-sm font-semibold">
                Input Type
              </label>
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

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-semibold">
                Price
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-center mt-6">
              <label htmlFor="isOptional" className="text-sm font-semibold">
                Optional
              </label>
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
            <div className="flex items-center mt-2">
  <label className="text-sm font-semibold">Add to Rate List</label>
  <input
    type="checkbox"
    name="addToRateList"
    checked={formData.addToRateList}
    onChange={handleChange}
    className="ml-2"
  />
</div>


          </div>

          {/* Method & Instrument */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="method" className="block text-sm font-semibold">
                Method
              </label>
              <input
                type="text"
                id="method"
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="instrument" className="block text-sm font-semibold">
                Instrument
              </label>
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
                  "advlist", "autolink", "lists", "link", "image", "charmap",
                  "preview", "anchor", "searchreplace", "visualblocks", "code",
                  "fullscreen", "insertdatetime", "media", "table", "help", "wordcount"
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
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditSinglepara;
