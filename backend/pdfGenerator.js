// backend/pdfGenerator.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import { generateBarcodeBase64 } from "./utils/barcode.js";

/**
 * Convert local image to base64
 */
const imageToBase64 = (imgPath) => {
  if (!fs.existsSync(imgPath)) return "";
  const ext = path.extname(imgPath).substring(1);
  const file = fs.readFileSync(imgPath);
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

/**
 * Generate PDF for report
 */
export const generatePDF = async (
  reportData,
  patient,
  letterhead,
  signatures = [],
  printSetting = {}
) => {
  // ✅ Use Chromium binary path compatible with Render
const executablePath =
  (await chromium.executablePath()) || "/usr/bin/google-chrome-stable";


  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  // Extract settings from backend PrintSetting
  const design = printSetting.design || {};
  const showHide = printSetting.showHide || {};
  const general = printSetting.general || {};
  const letterheadSettings = printSetting.letterhead || {};

  const fontFamily = design.fontFamily || "Arial";
  const fontSize = design.fontSize || 12;
  const spacing = design.spacing || 1;


  const barcodeBase64 = await generateBarcodeBase64(patient.regNo);

  // Logo
  const logoURL = letterhead.logo ? letterhead.logo : 'https://sanjay-lims.vercel.app/sanjay.png';

  // Signatures
  const signatureHTML = signatures.map(sig => {
    let sigSrc = sig.imageUrl ? (sig.imageUrl.startsWith("http") ? sig.imageUrl : imageToBase64(sig.imageUrl)) : '';
    return `
      <div style="text-align:center; margin:4px 8px;">
        ${sigSrc ? `<img src="${sigSrc}" style="height:50px;" />` : ''}
        <p style="font-size:10px; font-weight:600; margin:0;">${sig.name}</p>
        <p style="font-size:9px; color:#4b5563; margin:0;">${sig.designation || ''}</p>
      </div>
    `;
  }).join('');

  const renderTestRow = (test, design = {}, spacing = 1, fontSize = 12, fontFamily = 'Inter', useHLMarkers = true) => {
  const params = test.params || [];
  const groups = [...new Set(params.map(p => p.groupBy || "Ungrouped"))];

  const isOutOfRange = (value, reference) => {
    if (!value || !reference) return false;
    const match = reference.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (!match) return false;
    const [_, min, max] = match;
    const num = parseFloat(value);
    if (num < parseFloat(min)) return 'low';
    if (num > parseFloat(max)) return 'high';
    return false;
  };

  return `
    <div style="margin-bottom:${spacing * 8}px; font-size:${fontSize}px; font-family:${fontFamily};">
      ${groups.length > 1 ? `<div style="text-align:center; font-weight:600; background:#fff; padding:4px; margin-bottom:4px;">${test.testName}</div>` : ''}
      <table style="width:100%; border-collapse:collapse; font-size:${fontSize}px;">
        <thead>
          <tr style="border-top:1px solid #000; border-bottom:1px solid #000;">
            <th style="text-align:left; width:40%;">TEST</th>
            <th style="text-align:left; width:20%;">VALUE</th>
            <th style="text-align:left; width:20%;">UNIT</th>
            <th style="text-align:left; width:20%;">REFERENCE</th>
          </tr>
        </thead>
        <tbody>
          ${groups.map(group => {
            const groupParams = params.filter(p => (p.groupBy || "Ungrouped") === group);
            return `
              ${group && group !== "Ungrouped" ? `<tr><td colspan="4" style="font-weight:600;">${group}</td></tr>` : ''}

              ${params.length > 1 ? `
  <p style="
    font-weight: 600;
    color: #374151;       
    margin-bottom: 4px;   
    background-color: #fff;
    padding-top: 4px;     
    padding-bottom: 4px;
  ">
    ${test.testName}
  </p>
` : ''}

              ${groupParams.map(p => {
                // ✅ Compute HL
                const hl = useHLMarkers ? isOutOfRange(p.value, p.reference) : false;
                const isAbnormal = hl !== false; // true if high/low
                const boldValue = (hl !== false && design.boldAbnormal) || design.boldValues;
                let marker = '';
                if (hl === 'high') marker = ' ↑';
                if (hl === 'low') marker = ' ↓';
                
                // ✅ Apply styles correctly
                const color = isAbnormal && design.redAbnormal ? 'red' : 'black';
                const fontWeight = boldValue ? 'bold' : 'normal';

                return `
                  <tr>
                    <td style="padding:3px 5px;">${p.name}</td>
                    <td style="padding:3px 5px; font-weight:${fontWeight}; color:${color}">${p.value || '-'}${marker}</td>
                    <td style="padding:3px 5px;">${p.unit || '-'}</td>
                    <td style="padding:3px 5px;">${p.reference || '-'}</td>
                  </tr>
                `;
              }).join('')}
            `;
          }).join('')}
        </tbody>
      </table>
      ${test.interpretation ? `
        <div style="margin-top:4px; padding:4px; background:#fff; font-size:${fontSize}px;">
          <strong>Interpretation:</strong>
          <div style="margin-left:16px; margin-top:2px; color:#4b5563;">${test.interpretation}</div>
        </div>
      ` : ''}
    </div>
  `;
};


const renderPanelPage = (item, design, spacing, fontSize, fontFamily, useHLMarkers) => {
  if (!item) return '';
  return `
    <div style="margin-bottom:10px;">
      <div style="text-align:center; font-weight:600; background:#fff; padding:4px; margin-bottom:4px;">${item.panelOrPackageName || item.testName}</div>
      ${item.tests?.map(sub => sub.isPanel || sub.isPackage 
        ? renderPanelPage(sub, design, spacing, fontSize, fontFamily, useHLMarkers)
        : renderTestRow(sub, design, spacing, fontSize, fontFamily, useHLMarkers)
      ).join('')}
    </div>
  `;
};

const renderCategorySection = (category, design, spacing = 1, fontSize = 12, fontFamily = 'Inter', useHLMarkers = true) => {
  return `
    <div style="text-align:center; font-weight:600; text-transform:uppercase; margin:6px 0;">
      ${category.categoryName}
    </div>
    ${category.items?.map(item => item.isPanel || item.isPackage 
      ? renderPanelPage(item, design, spacing, fontSize, fontFamily, useHLMarkers)
      : renderTestRow(item, design, spacing, fontSize, fontFamily, useHLMarkers)
    ).join('')}
  `;
};


  // HTML Content
  const html = `
    <html>
      <head>
        <meta charset="UTF-8"/>
        <style>
          @page { margin:18mm 12mm; }
          body { font-family:${fontFamily}; font-size:${fontSize}px; color:#000; line-height:${spacing}; }
          table { width:100%; border-collapse:collapse; }
          th, td { padding:3px 5px; }
        </style>
      </head>
      <body>
        <table style="width:100%; min-height:297mm;">
          ${printSetting.withLetterhead ? `
          <thead>
            <tr>
              <th style="padding:${letterheadSettings.headerHeight || 4.5}mm; background:#fff; border-bottom:1px solid #d1d5db;">
                <!-- Header -->
                <div style="display:flex; justify-content:center; align-items:center; width:100%;">
  <img 
    src="${letterhead.headerImage || logoURL}" 
    alt="Header" 
    style="width:100%; max-height:120px; object-fit:contain;" 
  />
</div>

                


                <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%; border:1px solid #000; padding:6px;">
      
      <!-- Left section -->
      <div style="display:flex; flex-direction:column;">
        <p style="margin:2px 0; font-weight:600; font-size:${printSetting?.design?.fontSize || 12}px;">
          Patient: ${patient.firstName} ${patient.lastName}
        </p>
        <p style="margin:2px 0; font-weight:600; font-size:${printSetting?.design?.fontSize || 12}px;">
          Age/Sex: ${patient.age} ${patient.ageUnit || "Yrs"} / ${patient.sex}
        </p>
        <p style="margin:2px 0; font-weight:600; font-size:${printSetting?.design?.fontSize || 12}px;">
          Referred By: ${patient.doctor || "—"}
        </p>
      </div>

      <!-- Right section -->
      <div style="display:flex; flex-direction:column; text-align:right;">
      <div style="display:flex; flex-direction:row; gap:3px;>
        <p style="margin:2px 0; font-weight:600; font-size:${printSetting?.design?.fontSize || 12}px;">
          Date: ${new Date(reportData.createdAt).toLocaleDateString("en-GB")}
        </p>
        <p style="margin:2px 0; font-weight:600; font-size:${printSetting?.design?.fontSize || 12}px;">
          Time: ${new Date(reportData.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}
        </p>
        </div>
        <p style="margin:2px 0; font-weight:600; font-size:${printSetting?.design?.fontSize || 12}px;">
          PAT ID: ${patient.regNo}
        </p>
        <p style="margin:2px 0; font-weight:600; font-size:${printSetting?.design?.fontSize || 12}px;">
          UHID: ${patient.uhid}
        </p>
      </div>

      ${
  printSetting?.showHide?.showQRCode
    ? `<div style="margin-left:8px;">
         <img src="data:image/png;base64,${barcodeBase64}" alt="Barcode"
              style="height:40px; width:auto;" />
       </div>`
    : ""
}

      <!-- TAT Time (conditional) -->
      ${
        printSetting?.showHide?.showTATTime
          ? `<p style="margin:2px 0; font-weight:600; font-size:${printSetting?.design?.fontSize || 12}px;">
              TAT: ${calculateTAT(patient.createdAt, report.updatedAt)}
            </p>`
          : ""
      }

    </div>


              </th>
            </tr>
          </thead>
          ` : ''}

          <tbody>
            <tr>
              <td style="padding:${letterheadSettings.caseInfoHeight || 3}mm;">
                ${reportData.categories?.map(renderCategorySection).join('')}
              </td>
            </tr>
          </tbody>

          ${printSetting.withLetterhead ? `
          <tfoot style="display: table-footer-group;">
            <tr>
              <td style="padding:${letterheadSettings.signatureHeight || 3.4}mm; border-top:1px solid #d1d5db;">
                <div style="display:flex; flex-wrap:wrap; justify-content:space-between;">${signatureHTML}</div>
                <!-- Contact Info: 75/25 -->
                <div style="display:flex; justify-content:center; align-items:center; width:100%; margin-top:8px;">
  <img 
    src="${letterhead.footerImage}" 
    alt="Footer" 
    style="width:100%; max-height:100px; object-fit:contain;" 
  />
</div>


              </td>
            </tr>
          </tfoot>
          ` : ''}

        </table>
      </body>
    </html>
  `;

  await page.setContent(html, {
  waitUntil: "domcontentloaded",
  timeout: 0, // disables timeout completely
});

  const pdfBufferRaw = await page.pdf({ format: "A4", printBackground: true });
const pdfBuffer = Buffer.from(pdfBufferRaw); // ensure it's a Node Buffer
await browser.close();

console.log("Type of pdfBuffer:", typeof pdfBuffer);     // object
console.log("Is Buffer:", Buffer.isBuffer(pdfBuffer));   // true
console.log("PDF Buffer length:", pdfBuffer.length);

return pdfBuffer;

};
