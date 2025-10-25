import { useState } from "react";

const PreferredTest = () => {
  const [search, setSearch] = useState("");
  const [data] = useState([
    { id: 1, name: "UCT", count: 19 },
    { id: 2, name: "HbA1c", count: 19 },
    { id: 3, name: "Lipid Profile", count: 18 },
    { id: 4, name: "Liver Function Test (LFT)", count: 18 },
    { id: 5, name: "URA", count: 18 },
    { id: 6, name: "CBC with ESR", count: 17 },
    { id: 7, name: "RBS", count: 17 },
    { id: 8, name: "RENAL FUNCTION TESTS", count: 14 },
    { id: 9, name: "HIV (Card Test)", count: 14 },
    { id: 10, name: "HBsAg", count: 12 },
    { id: 11, name: "Serum Creatinine", count: 5 },
    { id: 12, name: "TCHOL", count: 2 },
  ]);

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Test counts</h1>

      {/* Info Banner */}
      <div className="bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-md p-3 mb-4 text-sm">
        This feature is not included in your plan, it is available only for
        preview. Upgrade option will be available in future.
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value="04/10/2025 - 04/10/2025"
          readOnly
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
          Show
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search in page"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-md shadow-sm">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-4 py-2 text-left border">S.NO.</th>
              <th className="px-4 py-2 text-left border">BILL ENTRY</th>
              <th className="px-4 py-2 text-left border">COUNT</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{index + 1}</td>
                  <td className="px-4 py-2 border">{item.name}</td>
                  <td className="px-4 py-2 border font-semibold">
                    {item.count}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="text-center py-4 text-gray-500 border"
                >
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreferredTest;
