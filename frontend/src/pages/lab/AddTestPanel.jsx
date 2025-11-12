import React, { useContext, useState } from "react";
import Select from "react-select";
import { LabContext } from "../../context/LabContext";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";

export default function AddTestPanel() {
  const { categories, dummyTests, branchToken, adminToken, branchId, successToast, errorToast } =
    useContext(LabContext);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    tests: [],
    hideInterpretation: true,
    hideMethod: true,
    interpretation: "",
    addToRateList: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Prepare Select options including unit
  const testOptions = dummyTests.map((t) => ({
    value: t._id,
    label: `${t.name} (${t.shortName}${t.unit ? ` - ${t.unit}` : ""})`,
    unit: t.unit || "",
  }));

  const handleSelectChange = (selected) => {
    setFormData((prev) => ({ ...prev, tests: selected || [] }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // Map selected tests to include full details
    const mappedTests = formData.tests.map((t) => {
      const fullTest = dummyTests.find((dt) => dt._id === t.value);
      return { ...fullTest }; // send entire test object
    });

    const payload = {
      name: formData.name,
      category: formData.category,
      price: Number(formData.price) || 0,
      tests: mappedTests,
      hideInterpretation: formData.hideInterpretation,
      hideMethod: formData.hideMethod,
      interpretation: formData.interpretation,
      addToRateList: formData.addToRateList,
    };

    let url = "";
    let headers = {};

    if (adminToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/panels/admin/add`;
      headers = { Authorization: `Bearer ${adminToken}` };
    } else if (branchToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/panels/add`;
      headers = { Authorization: `Bearer ${branchToken}` };
      payload.branchId = branchId;
    } else {
      errorToast?.("Unauthorized! Please login.");
      return;
    }

    const res = await axios.post(url, payload, { headers });

    if (res.data.success) {
      successToast?.("Test panel saved successfully!");
      setFormData({
        name: "",
        category: "",
        price: "",
        tests: [],
        hideInterpretation: true,
        hideMethod: true,
        interpretation: "",
        
      });
    } else {
      errorToast?.(res.data.message || "Failed to save panel");
    }
  } catch (err) {
    console.error("Error adding panel:", err);
    errorToast?.("Server error: Failed to save panel");
  }
};


  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-2xl font-semibold mb-3">Add new test panel</h2>
      <hr className="mb-4" />

      <div className="bg-blue-100 text-blue-800 px-4 py-3 rounded-md mb-6 text-sm border border-blue-200">
        💡 An entry for this panel will be created in ratelist automatically.
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter test panel name"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat, i) => (
              <option key={i} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Enter price"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hideInterpretation"
              checked={formData.hideInterpretation}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Hide individual test interpretation, notes, comments from report.
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hideMethod"
              checked={formData.hideMethod}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            Hide individual test method and instrument from report.
          </label>

          <label className="flex items-center gap-2 text-sm">
  <input
    type="checkbox"
    name="addToRateList"
    checked={formData.addToRateList}
    onChange={handleChange}
    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
  />
  Add this panel to rate list automatically.
</label>

        </div>

        {/* Tests */}
        <div>
          <label className="block text-sm font-medium mb-1">Tests</label>
          <Select
            isMulti
            options={testOptions}
            value={formData.tests}
            onChange={handleSelectChange}
            placeholder="Search and select multiple tests..."
            className="react-select-container relative z-50"
            classNamePrefix="react-select"
          />
          <p className="text-xs text-gray-500 mt-1">
            Search by typing full test name, short name, or unit.
          </p>
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
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
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

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Save
          </button>
          <button
            type="button"
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
