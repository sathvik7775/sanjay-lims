import React from "react";
import { Pencil } from "lucide-react";

const TestReferenceRanges = ({
  testName,
  testUnit,
  references,
  testshortName,
  branchToken,
  adminToken,
}) => {
  if (!references || references.length === 0) return null;

  // Group references by sex (for Numeric) or single group for Text
  const groupedBySex = references.reduce((acc, r) => {
    const groupKey = r.which === "Text" ? "Text" : r.sex || "Any";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(r);
    return acc;
  }, {});

  return (
    <div className="bg-gray-50 border rounded-lg shadow-sm p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          {testName}
          {testshortName && (
            <span className="text-gray-600 text-sm font-normal ml-1">
              ({testshortName})
            </span>
          )}
          {testUnit && (
            <span className="text-gray-600 text-sm font-normal ml-1">
              [{testUnit}]
            </span>
          )}
        </h3>

        {adminToken && (
          <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
            <Pencil size={14} />
            Edit normal values
          </button>
        )}
      </div>

      {/* Reference Ranges */}
      <div className="relative pl-4">
        <div className="absolute left-1 top-0 bottom-0 w-px bg-gray-300" />

        <div className="space-y-3">
          {Object.keys(groupedBySex).map((groupKey) => {
            const refs = groupedBySex[groupKey].sort((a, b) => a.minAge - b.minAge);

            return (
              <div key={groupKey} className="relative pl-4">
                {/* Tree-like connectors */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300" />
                <div className="absolute left-0 top-3 w-4 border-t border-gray-300" />

                <div className="font-medium text-gray-700 mb-1">
                  {groupKey === "Text" ? "Visual / Text Values" : groupKey}
                </div>

                <div className="relative pl-4">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-1">
                    {refs.map((ref) => (
                      <div
                        key={ref._id}
                        className="relative text-gray-700 text-sm pl-4"
                      >
                        <div className="absolute left-0 top-2 w-3 border-t border-gray-200" />

                        {/* Numeric vs Text */}
                        {ref.which === "Text" ? (
                          <span className="italic text-gray-600">
                            {ref.textValue || ref.displayText || "—"}
                          </span>
                        ) : (
                          <>
                            {ref.lower != null && ref.upper != null
                              ? `${ref.lower} - ${ref.upper}`
                              : "-"}{" "}
                            <span className="text-gray-500">
                              ({ref.minAge}
                              {ref.minUnit?.charAt(0).toUpperCase()} -{" "}
                              {ref.maxAge}
                              {ref.maxUnit?.charAt(0).toUpperCase()})
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestReferenceRanges;
