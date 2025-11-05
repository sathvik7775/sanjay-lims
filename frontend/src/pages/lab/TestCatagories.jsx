import React, { useContext, useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { LabContext } from "../../context/LabContext";
import axios from "axios";

export default function TestCategories({ branchId }) {
  const [categories, setCategories] = useState([]);
  const { navigate, adminToken, branchToken, successToast, errorToast } = useContext(LabContext);

  // Fetch all global categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // ✅ Use correct route based on user type
        const url = adminToken
          ? `${import.meta.env.VITE_API_URL}/api/test/category/admin/list`
          : `${import.meta.env.VITE_API_URL}/api/test/category/list`;

        const headers = adminToken
          ? { Authorization: `Bearer ${adminToken}` }
          : { Authorization: `Bearer ${branchToken}` };

        const res = await axios.get(url, { headers });
        if (res.data.success) setCategories(res.data.categories.reverse());

      } catch (err) {
        console.error("Error fetching categories:", err);
        errorToast?.("Failed to fetch categories");
      }
    };

    fetchCategories();
  }, [adminToken, branchToken]);

  // Drag & drop visual reorder (frontend only)
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(categories);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setCategories(items);
  };

  // Delete category (admin only)
  const handleDelete = async (id) => {
    if (!adminToken) return;
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/test/category/admin/delete/${id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.data.success) {
        successToast?.("Category deleted successfully");
        setCategories((prev) => prev.filter((c) => c._id !== id));
      } else {
        errorToast?.(res.data.message || "Failed to delete category");
      }
    } catch (err) {
      console.error(err);
      errorToast?.("Failed to delete category");
    }
  };

  const addNewPath = adminToken ? "/admin/new-category" : `/${branchId}/new-category`;

  return (
    <div className="p-6 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Test Departments</h1>
        <button
          onClick={() => navigate(addNewPath)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add New
        </button>
      </div>

      <div className="mb-4 p-2 border rounded bg-gray-50 flex items-center">
        <span className="text-gray-600">👉 Drag rows to reorder</span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <table
              className="min-w-full border-collapse border border-gray-300 text-sm"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 w-16 text-center">#</th>
                  <th className="border px-4 py-2 text-left">Name</th>
                  <th className="border px-4 py-2 text-left">Created By</th>
                  <th className="border px-4 py-2 text-left">Status</th>
                  {adminToken && <th className="border px-4 py-2 w-48 text-center">Action</th>}
                </tr>
              </thead>

              <tbody>
                {categories.length > 0 ? (
                  categories.map((cat, index) => (
                    <Draggable key={cat._id} draggableId={cat._id} index={index}>
                      {(provided, snapshot) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${snapshot.isDragging ? "bg-blue-50" : "bg-white"} hover:bg-gray-50`}
                        >
                          <td className="border px-4 py-2 text-center cursor-grab">{index + 1}</td>
                          <td className="border px-4 py-2">{cat.name}</td>
                          <td className="border px-4 py-2 capitalize">{cat.createdBy}</td>
                          <td className="border border-black px-4 py-2 text-green-600">{cat.status}</td>
                          {adminToken ? (
                            <td className="border px-4 py-2 text-center space-x-3">
                              <span
                                className="cursor-pointer hover:underline text-blue-600"
                                onClick={() => navigate(`/admin/edit-category/${cat._id}`)}
                              >
                                ✏️ Edit
                              </span>
                              <span
                                className="cursor-pointer hover:underline text-red-600"
                                onClick={() => handleDelete(cat._id)}
                              >
                                🗑 Delete
                              </span>
                            </td>
                          ) : (
                            <td className="border px-4 py-2 text-center space-x-3">
                              <span
                              
                                className="cursor-pointer hover:underline text-blue-600"
                                onClick={() => navigate(`/${branchId}/database`)}
                              >
                                ✏️ view all
                              </span>
                              
                            </td>
                          )}
                        </tr>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <tr>
                    <td colSpan={adminToken ? 5 : 4} className="text-center text-gray-500 py-6 border">
                      No categories found.
                    </td>
                  </tr>
                )}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
