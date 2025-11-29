import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfPreview = ({ pdfUrl }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!pdfUrl) return;

    const loadPdf = async () => {
      const container = containerRef.current;
      container.innerHTML = ""; // clear old pages

      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);

        const viewport = page.getViewport({ scale: 1 });
        const desiredWidth = 400; // preview page width
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        // Create canvas for each page
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.marginBottom = "12px";
        canvas.style.border = "1px solid #d1d5db";
        canvas.style.borderRadius = "8px";
        canvas.style.background = "white";
        canvas.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";

        container.appendChild(canvas);

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
      }
    };

    loadPdf();
  }, [pdfUrl]);

  return (
    <div
      className="flex justify-center"
      style={{
        maxHeight: "500px",  // scrollable height
        overflowY: "auto",   // enable scrolling
        padding: "10px",
      }}
    >
      <div ref={containerRef}></div>
    </div>
  );
};

export default PdfPreview;
