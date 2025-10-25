import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";

const EditDocumentpara = () => {
  const { id } = useParams(); // ✅ get test id from route
  const navigate = useNavigate();
  const { errorToast, successToast, branchId, adminToken, branchToken, categories } =
    useContext(LabContext);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    category: "",
    price: "",
    defaultResult: "",
    displayInReport: true,
  });

  // Fetch existing test data
  useEffect(() => {
    const fetchTest = async () => {
      if (!id) return;
      try {
        setLoading(true);
        let url = "";
        let headers = {};

        if (adminToken) {
          url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${id}`;
          headers = { Authorization: `Bearer ${adminToken}` };
        } else if (branchToken) {
          url = `${import.meta.env.VITE_API_URL}/api/test/database/test/${id}`;
          headers = { Authorization: `Bearer ${branchToken}` };
        }

        const res = await axios.get(url, { headers });

        console.log(res.data);
        

        if (res.data.success && res.data.data) {
          const test = res.data.data;
          setFormData({
            name: test.name || "",
            shortName: test.shortName || "",
            category: test.category || "",
            price: test.price || "",
            defaultResult: test.defaultResult || "",
            displayInReport:
              test.displayInReport === undefined ? true : test.displayInReport,
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Submit updated test data
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

      const payload = {
        name: formData.name,
        shortName: formData.shortName,
        type: "document",
        category: formData.category,
        price: Number(formData.price),
        defaultResult: formData.defaultResult,
        displayInReport: formData.displayInReport,
      };

      let url = "";
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
    <div className=" mt-10 bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Edit Test (Document)
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="p-4 border border-gray-200 rounded-md space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="p-2 border border-gray-300 rounded-md w-64 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="shortName"
                className="block text-sm font-medium mb-1"
              >
                Short Name
              </label>
              <input
                type="text"
                id="shortName"
                name="shortName"
                value={formData.shortName}
                onChange={handleInputChange}
                className="p-2 border border-gray-300 rounded-md w-64 focus:ring-2 focus:ring-blue-500"
                placeholder="Short code"
              />
            </div>
          </div>

          <div>
  <label className="block text-sm mb-1">Category</label>
  <input
    list="categories"
    name="category"
    value={formData.category}
    onChange={handleInputChange}
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
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded-md w-64 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter price"
            />
          </div>
        </div>

        {/* Editor Section */}
        <div className="p-4 border border-gray-200 rounded-md">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="displayInReport"
              name="displayInReport"
              checked={formData.displayInReport}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label htmlFor="displayInReport" className="text-sm text-gray-600">
              Display test name in report
            </label>
          </div>

          <label className="block text-sm font-medium mb-2">
            Default Result / Interpretation
          </label>

          <Editor
            apiKey="0vfv6vlb9kccql8v3on0qtobc8m7irv267colygcsartuoxa"
            value={formData.defaultResult}
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
              setFormData((prev) => ({ ...prev, defaultResult: content }))
            }
          />
        </div>

        {/* Buttons */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDocumentpara;
