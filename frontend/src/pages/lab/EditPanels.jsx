import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { LabContext } from "../../context/LabContext";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";

export default function EditPanels() {
  const { categories, dummyTests, adminToken, branchToken, successToast, errorToast } =
    useContext(LabContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!adminToken && branchToken) {
      errorToast?.("You are not authorized to edit panels.");
      navigate("/"); // redirect branch users
      return;
    }

    const fetchPanel = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        if (res.data.success) {
          const p = res.data.data;

          // Map existing panel tests to Select format
          const mappedTests = p.tests.map((t) => ({
            value: t._id,
            label: `${t.name} (${t.shortName}${t.unit ? ` - ${t.unit}` : ""})`,
            fullTest: t, // store full test object
          }));

          setFormData({
            name: p.name || "",
            category: p.category || "",
            price: p.price || "",
            tests: mappedTests,
            hideInterpretation: p.hideInterpretation,
            hideMethod: p.hideMethod,
            interpretation: p.interpretation || "",
            addToRateList: p.addToRateList || false,
          });
        } else {
          errorToast?.("Panel not found");
        }
      } catch (err) {
        console.error("Error fetching panel:", err);
        errorToast?.("Failed to load panel details");
      } finally {
        setLoading(false);
      }
    };

    if (id && adminToken) fetchPanel();
  }, [id, adminToken]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (selected) => {
    setFormData((prev) => ({ ...prev, tests: selected || [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send full test details for backend
      const mappedTests = formData.tests.map((t) => {
        const fullTest =
          t.fullTest || dummyTests.find((dt) => dt._id === t.value) || {};
        return { ...fullTest };
      });

      const payload = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price) || 0,
        tests: mappedTests, // send full test objects
        hideInterpretation: formData.hideInterpretation,
        hideMethod: formData.hideMethod,
        interpretation: formData.interpretation,
        addToRateList: formData.addToRateList,
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/test/panels/admin/edit/${id}`,
        payload,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        successToast?.("Panel updated successfully!");
        navigate("/admin/test-panels");
      } else {
        errorToast?.(res.data.message || "Failed to update panel");
      }
    } catch (err) {
      console.error("Error updating panel:", err);
      errorToast?.("Server error: Failed to update panel");
    }
  };

  if (loading) return <div className="text-center mt-10">Loading panel...</div>;

  if (!adminToken && branchToken) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
        ❌ You are not authorized to edit panels.
      </div>
    );
  }

  const testOptions = dummyTests.map((t) => ({
    value: t._id,
    label: `${t.name} (${t.shortName}${t.unit ? ` - ${t.unit}` : ""})`,
    fullTest: t,
  }));

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-2xl font-semibold mb-3">Edit Test Panel</h2>
      <hr className="mb-4" />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
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
          />

          
        </div>

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

        {/* Interpretation */}
        {!loading && (
  <div>
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
        content_style:
          "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }",
        branding: false,
      }}
      onEditorChange={(content) =>
        setFormData((prev) => ({ ...prev, interpretation: content }))
      }
    />
  </div>
)}


        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Update
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/test-panels")}
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
