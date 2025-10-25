import React from "react";
import { Phone, Smartphone, Mail, Globe } from "lucide-react";

const LetterheadPreview = ({ lh }) => {
  return (
    <div
      className="bg-white w-[210mm] h-[297mm] flex flex-col justify-between mx-auto shadow-sm"
      style={{ minHeight: "297mm", minWidth: "210mm", boxSizing: "border-box" }}
    >
      
      {/* Header */}
      <header className="p-4 border-b border-gray-300">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <img
              src={lh?.logo || "/sanjay.png"}
              alt="Logo"
              className="h-20 w-20 object-contain"
            />
            <div className="flex flex-col items-start mt-2">
              <h1 className="text-2xl font-extrabold text-green-700">
                {lh?.name || "LIFE LINE LABORATORY"}
              </h1>
              <h2 className="text-xl font-bold text-green-700 -mt-1">
                {lh?.subName || "DIAGNOSTIC"}
              </h2>
              <p className="text-sm text-blue-700 font-medium">
                {lh?.tagline || "Test Results You Can Trust"}
              </p>
            </div>
          </div>
          <div className="text-right text-xs w-50 text-gray-700 whitespace-pre-line mt-4">
            <p>{lh?.address || "Main Road, Konandur"}</p>
          </div>
        </div>
        <div className="px-4 mt-3">
          <div className="h-[0.5px] bg-[#008236]"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1">
        [Result content here]
      </main>

      {/* Footer */}
      <footer className="mt-4">
        <div className="flex w-full text-white text-xs items-center">
          <div
            className="flex flex-1 items-center justify-center gap-6 py-1 px-4"
            style={{ backgroundColor: "#16a34a" }}
          >
            <p className="flex items-center gap-1">
              <Phone className="w-4 h-4" />0816-4069357
            </p>
            <p className="flex items-center gap-1">
              <Smartphone className="w-4 h-4" />+91 {lh?.contact || "9980121730"}
            </p>
            <p className="flex items-center gap-1">
              <Globe className="w-4 h-4" />{lh?.website || "www.sanjaylab.in"}
            </p>
          </div>
          <div
            className="flex items-center justify-center py-1 px-4"
            style={{ backgroundColor: "#2563eb" }}
          >
            <p className="flex items-center gap-1">
              <Mail className="w-4 h-4" />{lh?.email || "sanjay@gmail.com"}
            </p>
          </div>
        </div>

        <div className="text-black px-6 py-2 text-xs flex w-full justify-between gap-3">
          

          <div className="flex justify-between w-full gap-3 items-center sm:items-end">
            <div className="flex items-center gap-2">
              <img src="/delivery-bike.png" className="w-7 h-7" alt="" />
              <div className="flex flex-col items-center">
                <p className="font-bold">Home collection</p>
                <p className="font-bold">Available</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img src="/whatsapp.png" className="w-7 h-7" alt="" />
              <div className="flex flex-col items-center">
                <p className="font-bold">Get Reports Via</p>
                <p className="font-bold">SMS / WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LetterheadPreview;
