import React, { useContext, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { LabContext } from "../../../context/LabContext";


const initialCategories = [
  { id: "1", name: "Haematology" },
  { id: "2", name: "Biochemistry" },
  { id: "3", name: "Serology & Immunology" },
  { id: "4", name: "Clinical Pathology" },
  { id: "5", name: "Cytology" },
  { id: "6", name: "Microbiology" },
  { id: "7", name: "Endocrinology" },
  { id: "8", name: "Histopathology" },
  { id: "9", name: "Others" },
  { id: "10", name: "Miscellaneous" },
  { id: "11", name: "Prolactin" },
  { id: "12", name: "ANTI TPO: ANTI THYROID PEROXIDASE ANTIBODY" },
  { id: "13", name: "ANTI TPO: ANTI THYROID PEROXIDASE ANTIBODY" },
];

export default function AdminCategories() {
  const [categories, setCategories] = useState(initialCategories);
  const {navigate} = useContext(LabContext)

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCategories(items);
  };

  return (
    <div className="p-6 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Test categories</h1>
        <button onClick={()=> navigate('/admin/new-catagory')} className="bg-blue-600 text-white px-4 py-2 rounded">
          + Add new
        </button>
      </div>

      <div className="mb-4 p-2 border rounded bg-gray-50 flex items-center">
        
        <span className="text-gray-600">👉 Drag rows with your mouse to reorder</span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <table
              className="min-w-full border-collapse border border-gray-300"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 w-16">ORDER</th>
                  <th className="border px-4 py-2 text-left">NAME</th>
                  <th className="border px-4 py-2 w-48">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <Draggable key={cat.id} draggableId={cat.id} index={index}>
                    {(provided, snapshot) => (
                      <tr
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`${
                          snapshot.isDragging ? "bg-blue-50" : "bg-white"
                        } hover:bg-gray-50`}
                      >
                        <td className="border px-4 py-2 text-center cursor-grab">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-2">{cat.name}</td>
                        <td className="border px-4 py-2 flex space-x-4 text-blue-600">
                          <span className="cursor-pointer">✏️ Edit</span>
                          <span className="cursor-pointer">👁️ View tests</span>
                        </td>
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
  );
}


