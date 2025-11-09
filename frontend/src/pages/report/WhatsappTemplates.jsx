import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit2, Trash2, Plus } from "lucide-react";

import { useContext } from "react";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const WhatsappTemplates = () => {
    const {adminToken, successToast, errorToast} = useContext(LabContext)
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    triggerType: "welcome",
    message: "",
    delayMinutes: 0,
  });
  const [editId, setEditId] = useState(null);
  

  // 🔹 Fetch all templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/whatsapp/get`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error(err);
      errorToast("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 🔹 Handle form submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${adminToken}` },
      };

      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/whatsapp/${editId}`, formData, config);
        successToast("Template updated successfully");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/whatsapp/add`, formData, config);
        successToast("Template added successfully");
      }

      setFormData({ title: "", triggerType: "welcome", message: "", delayMinutes: 0 });
      setEditId(null);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      errorToast("Error saving template");
    }
  };

  // 🔹 Delete Template
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/whatsapp/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      fetchTemplates();
    } catch (err) {
      console.error(err);
      errorToast("Failed to delete template");
    }
  };

  // 🔹 Edit Template
  const handleEdit = (template) => {
    setEditId(template._id);
    setFormData({
      title: template.title,
      triggerType: template.triggerType,
      message: template.message,
      delayMinutes: template.delayMinutes || 0,
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-center">📱 WhatsApp Message Templates</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-5 mb-6 space-y-3 border"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. Welcome Message"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Trigger Type</label>
            <select
              value={formData.triggerType}
              onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="welcome">Welcome</option>
              <option value="bill">Bill</option>
              <option value="report">Report</option>
              <option value="sample_received">Sample Received</option>
              <option value="payment_confirmation">Payment Confirmation</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Message</label>
          <textarea
            rows="4"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Type WhatsApp message here. Use {{patientName}}, {{billAmount}} etc."
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Delay (minutes)</label>
          <input
            type="number"
            value={formData.delayMinutes}
            onChange={(e) => setFormData({ ...formData, delayMinutes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="0"
            min="0"
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg mt-2"
        >
          {editId ? "Update Template" : "Add Template"}
        </button>
      </form>

      {/* List */}
      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-4">
          {templates.length === 0 ? (
            <p className="text-center text-gray-500">No templates added yet.</p>
          ) : (
            templates.map((tpl) => (
              <div
                key={tpl._id}
                className="bg-white shadow-sm border rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  <h3 className="font-semibold text-lg">{tpl.title}</h3>
                  <p className="text-sm text-gray-500">Trigger: {tpl.triggerType}</p>
                  <p className="mt-2 text-gray-700 whitespace-pre-line">{tpl.message}</p>
                  {tpl.delayMinutes > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Delay: {tpl.delayMinutes} minute(s)
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEdit(tpl)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsappTemplates;
