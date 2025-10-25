import React, { useState } from 'react'

const AdminNewCategory = () => {
    const [name, setName] = useState("");
    
      const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
          alert("Please enter a category name.");
          return;
        }
        console.log("Category Saved:", name);
        alert(`Category "${name}" saved successfully!`);
        setName("");
      };
  return (
     <div className="max-w-md mx-auto mt-10 bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h1 className="text-2xl font-semibold mb-6">New Category</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="categoryName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            * Name
          </label>
          <input
            type="text"
            id="categoryName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Save
        </button>
      </form>
    </div>
  )
}

export default AdminNewCategory
