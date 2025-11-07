import React from "react";
import { Phone, Smartphone, Mail, Globe } from "lucide-react";

const LetterheadPreview = ({ lh }) => {
  return (
    <div
      className="bg-white w-[210mm] h-[297mm] flex flex-col justify-between mx-auto shadow-sm"
      style={{ minHeight: "297mm", minWidth: "210mm", boxSizing: "border-box" }}
    >
      
      {/* Header */}
      <header className="">
  {lh?.headerImage && (
    <img
      src={lh.headerImage}
      alt="Header"
      className="w-full object-contain"
      style={{ height: `${lh?.headerHeight || 120}px` }}
    />
  )}
</header>


      {/* Main Content */}
      <main className="p-4 flex-1">
        [Result content here]
      </main>

      {/* Footer */}
      <footer className="">
  {lh?.footerImage && (
    <img
      src={lh.footerImage}
      alt="Footer"
      className="w-full object-contain"
      style={{ height: `${lh?.footerHeight || 100}px` }}
    />
  )}
</footer>

    </div>
  );
};

export default LetterheadPreview;
