import React, { useContext, useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { LabContext } from "../../context/LabContext";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Loader from "../../components/Loader";

export default function TestPanels({ branchId }) {
  const { adminToken, branchToken, successToast, errorToast } = useContext(LabContext);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch panels
  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const token = adminToken || branchToken;
        const headers = { Authorization: `Bearer ${token}` };

        const url = adminToken
          ? `${import.meta.env.VITE_API_URL}/api/test/panels/admin/list`
          : `${import.meta.env.VITE_API_URL}/api/test/panels/list`;

        const res = await axios.get(url, { headers });

      
        

        if (res.data.success) {
          setPanels(res.data.panels.reverse() || []);
        } else {
          errorToast(res.data.message || "Failed to load panels");
        }
      } catch (err) {
        console.error("Error fetching panels:", err);
        errorToast("Error fetching panels");
      } finally {
        setLoading(false);
      }
    };

    fetchPanels();
  }, [adminToken, branchToken, errorToast]);

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  // ✅ Handle reorder (optional visual)
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(panels);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setPanels(reordered);
  };

  // ✅ Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this panel?")) return;
    try {
      if (!adminToken) return errorToast("Only admins can delete panels");

      const headers = { Authorization: `Bearer ${adminToken}` };
      const url = `${import.meta.env.VITE_API_URL}/api/test/panels/admin/delete/${id}`;

      const res = await axios.delete(url, { headers });

      if (res.data.success) {
        successToast("Panel deleted successfully");
        setPanels((prev) => prev.filter((p) => p._id !== id));
      } else {
        errorToast(res.data.message || "Failed to delete panel");
      }
    } catch (err) {
      console.error("Error deleting panel:", err);
      errorToast("Error deleting panel");
    }
  };

  // ✅ Handle edit navigation (Admin only)
  const handleEdit = (id) => {
    if (!adminToken) return errorToast("Only admins can edit panels");
    navigate(`/admin/edit-panel/${id}`);
  };

  const addNewPath = adminToken
    ? "/admin/add-panel"
    : `/${branchId}/add-panel`;

  if (loading) return <Loader/>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Test Panels</h1>
        <Link
          to={addNewPath}
          className="px-3 py-1 rounded border bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition"
        >
          + Add New
        </Link>
      </div>

      <div className="bg-gray-100 border px-3 py-2 rounded mb-4 text-gray-700">
        <span className="font-medium">👉 Drag rows with your mouse to reorder</span>
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="panels">
            {(provided) => (
              <table
                className="w-full text-sm border-collapse"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="border px-3 py-2 w-20">ORDER</th>
                    <th className="border px-3 py-2">NAME</th>
                    <th className="border px-3 py-2">CATEGORY</th>
                    <th className="border px-3 py-2">TESTS</th>
                    <th className="border px-3 py-2">PRICE</th>
                    {adminToken && <th className="border px-3 py-2 text-center w-32">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody>
                  {panels.map((panel, index) => (
                    <Draggable key={panel._id} draggableId={panel._id} index={index}>
                      {(provided, snapshot) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`hover:bg-gray-50 align-top ${
                            snapshot.isDragging ? "bg-blue-50" : ""
                          } cursor-grab`}
                        >
                          <td className="border px-3 py-2">{index + 1}.</td>
                          <td className="border px-3 py-2">{panel.name}</td>
                          <td className="border px-3 py-2">{panel.category || "-"}</td>
                          <td className="border px-3 py-2">
                            {panel.tests?.length ? (
                              <>
                                <span>
                                  {panel.tests.slice(0, 3).map((t) => t.name).join(", ")}...
                                </span>
                                <button
                                  onClick={() => toggleExpand(panel._id)}
                                  className="ml-2 text-blue-500 text-xs hover:underline"
                                >
                                  ({expanded === panel._id
                                    ? "Hide"
                                    : `${panel.tests.length} tests`})
                                </button>
                                {expanded === panel._id && (
                                  <ul className="mt-2 list-disc list-inside text-gray-600 text-xs">
                                    {panel.tests.map((t, i) => (
                                      <li key={i}>{t.name}</li>
                                    ))}
                                  </ul>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 italic">No tests</span>
                            )}
                          </td>
                          <td className="border px-3 py-2">{panel.price || "-"}</td>

                          {adminToken && (
                            <td className="border px-3 py-2 text-center space-x-2">
                              <button
                                onClick={() => handleEdit(panel._id)}
                                className="text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(panel._id)}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              </table>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
