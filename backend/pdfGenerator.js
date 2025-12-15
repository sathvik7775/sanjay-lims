// backend/pdfGenerator.js

import { chromium } from "playwright";

import QRCode from "qrcode";   // <-- install: npm i qrcode


import fs from "fs";
import path from "path";
import { generateBarcodeBase64 } from "./utils/barcode.js";


let browser;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
  }
  return browser;
}


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
  printSetting = {},
  publicPdfUrl = null
) => {
  // ✅ Use Chromium binary path compatible with Render
  const browser = await getBrowser();

  const page = await browser.newPage();

  // ✅ Allow remote image/network loading (important for Cloudinary)
  // Playwright automatically loads images, scripts, fonts
  // await page.setJavaScriptEnabled(true);
  // optional – safe to keep


  let qrBase64 = "";
if (publicPdfUrl) {
  qrBase64 = await QRCode.toDataURL(publicPdfUrl, {
    margin: 0,
    width: 130
  });
}



  // Extract settings from backend PrintSetting
  const design = printSetting.design || {};
  const showHide = printSetting.showHide || {};
  const general = printSetting.general || {};
  const letterheadSettings = printSetting.letterhead || {};

  const fontFamily = design.fontFamily || "Arial";
  const fontSize = design.fontSize || 12;
  const spacing = design.spacing || 1;
  const useHLMarkers = general.useHLMarkers === true;



  const barcodeBase64 = await generateBarcodeBase64(patient.regNo);

  // Handle header and footer images properly



  // Logo


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

  // --- normalize settings into boolean flags ---
  const redAbFlag = !!design.redAbnormal;
  const boldAbFlag = !!design.boldAbnormal;

  const boldValuesFlag = !!design.boldValues;
  const indentNestedFlag = !!design.indentNested;
  const useHLMarkersFlag = general.useHLMarkers === true;
  const categoryNewFlag = general.categoryNewPage === true;
  const capetalizeTestFlag = general.capitalizeTests === true;

  console.log({ redAbFlag, boldAbFlag, boldValuesFlag, indentNestedFlag, useHLMarkersFlag, capetalizeTestFlag });


  // Helper: detect out-of-range
  const isOutOfRange = (value, reference) => {
    if (!value || !reference) return false;
    const match = String(reference).match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (!match) return false;
    const [, min, max] = match;
    const num = parseFloat(value);
    if (Number.isNaN(num)) return false;
    if (num < parseFloat(min)) return "low";
    if (num > parseFloat(max)) return "high";
    return false;
  };

  function capitalizeText(str) {
    if (!str) return "";

    return str
      .split(" ")
      .map(word => {
        if (/^[A-Z]+$/.test(word)) return word;
        if (/^[0-9.:-]+$/.test(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }


  // Render a single test (may contain params)
  const renderTestRow = (
    test,
    design = {},
    spacing = 1,
    fontSize = 12,
    fontFamily = "Inter",
    useHL = true,
    redAb = true,
    boldAb = true,
    boldValues = false,
    indentNested = false,
    capetalizeTestFlag = false

  ) => {
    const params = test.params || [];
    const groups = [...new Set(params.map((p) => p.groupBy || "Ungrouped"))];

    return `
      ${groups
        .map((group) => {
          const groupParams = params.filter(
            (p) => (p.groupBy || "Ungrouped") === group
          );

          return `
            ${group &&
              group.length > 0 &&
              groups[0] === group &&
              params.length > 1
              ? `<tr>
                    <td colspan="4" style="padding:4px 8px; font-weight:600; font-size:13px;">
                      ${capetalizeTestFlag ? capitalizeText(test.testName) : test.testName}

                    </td>
                  </tr>`
              : ""
            }


            ${group && group !== "Ungrouped" ? `<tr><td colspan="4" style="font-weight:600;">${group}</td></tr>` : ""}

            ${groupParams
              .map((p) => {
                // HL / abnormal detection only when useHL true
                const hl = useHL ? isOutOfRange(p.value, p.reference) : false;

                // color & weight rules:
                // - if hl and redAb true => red, otherwise black
                // - value weight: if hl and boldAb true => bold
                //               else if boldValues true => bold
                //               else normal
                const color = hl ? (redAb ? "red" : "black") : "black";
                const valueWeight = hl
                  ? boldAb
                    ? "bold"
                    : "normal"
                  : boldValues
                    ? "bold"
                    : "normal";

                // marker arrows
                const marker = hl === "high" ? " ↑" : hl === "low" ? " ↓" : "";

                // indent nested/grouped items if flag set
                const paddingLeft =
                  indentNested && group && group !== "Ungrouped" && params.length > 1
                    ? "12px"
                    : "5px";

                return `
                  <tr>
                    <td 
  style="padding:3px 5px; padding-left:${paddingLeft}; padding-bottom:${spacing};"
>
  ${indentNested && group && group !== "Ungrouped" && params.length > 1 ? "✦ " : ""}${capetalizeTestFlag ? capitalizeText(p.name) : p.name}


</td>


                    <td style="padding:3px 5px; font-weight:${valueWeight}; color:${color};">${p.value || "-"}${marker}</td>
                    <td style="padding:3px 5px;">${p.unit || "-"}</td>
                    <td style="padding:3px 5px;">${p.reference || "-"}</td>
                  </tr>
                `;
              })
              .join("")}
          `;
        })
        .join("")}
      ${test.interpretation ? `
        <tr>
          <td colspan="4" style="padding:4px; color:#374151;">
            <strong>Interpretation:</strong>
            <div style="margin-top:4px; margin-left:12px; line-height:1.5;">
              ${test.interpretation || ""}
            </div>
          </td>
        </tr>
      ` : ""}
    `;
  };

  // Render panel (recursively)
  const renderPanelPage = (
    item,
    design,
    spacing,
    fontSize,
    fontFamily,
    useHL,
    redAb,
    boldAb,
    boldValues,
    indentNested,
    capetalizeTestFlag = false
  ) => {
    if (!item) return "";
    return `
      <tr>
        <td colspan="4" style="text-align:center; font-weight:600; background:#fff; padding:4px;">
          ${item.panelOrPackageName || item.testName}
        </td>
      </tr>
      ${(item.tests || [])
        .map((sub) =>
          sub.isPanel || sub.isPackage
            ? renderPanelPage(
              sub,
              design,
              spacing,
              fontSize,
              fontFamily,
              useHL,
              redAb,
              boldAb,
              boldValues,
              indentNested,
              capetalizeTestFlag
            )
            : renderTestRow(
              sub,
              design,
              spacing,
              fontSize,
              fontFamily,
              useHL,
              redAb,
              boldAb,
              boldValues,
              indentNested,
              capetalizeTestFlag
            )
        )
        .join("")
      }
      ${item.interpretation
        ? `<tr>
              <td colspan="4" style="padding:4px; color:#374151;">
                <strong>Interpretation:</strong>
                <div style="margin-top:4px; margin-left:12px; line-height:1.5;">
                  ${item.interpretation || ""}
                </div>
              </td>
            </tr>`
        : ""
      }
    `;
  };

  // Calculate Turn Around Time (TAT)
  function calculateTAT(start, end) {
    try {
      const s = new Date(start);
      const e = new Date(end);

      if (!s || !e) return "--";

      const diffMs = e - s;
      if (diffMs < 0) return "--";

      const diffMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    } catch {
      return "--";
    }
  }


  // Render category — ensure we pass flags to nested renders
  const renderCategorySection = (
    category,
    design,
    spacing = 1,
    fontSize = 12,
    fontFamily = "Inter",
    useHL,
    categoryNewPage,
    capetalizeTestFlag
  ) => {


    const categoryStyle =
  category.categoryName &&
  category.categoryName.trim().toLowerCase() === "clinical pathology"
    ? "page-break-before: always; margin-bottom: 10px;"
    : categoryNewPage
        ? "page-break-before: always; margin-bottom: 10px;"
        : "margin-bottom: 10px;";


    return `
      <div style="${categoryStyle}">
        <div style="text-align:center; font-weight:600; text-transform:uppercase; margin:6px 0;">
          ${category.categoryName}
        </div>

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
            ${(category.items || [])
        .map((item) =>
          item.isPanel || item.isPackage
            ? renderPanelPage(
              item,
              design,
              spacing,
              fontSize,
              fontFamily,
              useHL,
              redAbFlag,
              boldAbFlag,
              boldValuesFlag,
              indentNestedFlag,
              capetalizeTestFlag
            )
            : renderTestRow(
              item,
              design,
              spacing,
              fontSize,
              fontFamily,
              useHL,
              redAbFlag,
              boldAbFlag,
              boldValuesFlag,
              indentNestedFlag,
              capetalizeTestFlag
            )
        )
        .join("")
      }
          </tbody>
        </table>
      </div>
    `;
  };


  const headerImageSrc = letterhead.headerImage
    ? (letterhead.headerImage.startsWith("http")
      ? letterhead.headerImage
      : imageToBase64(letterhead.headerImage))
    : logoURL;

  const footerImageSrc = letterhead.footerImage
    ? (letterhead.footerImage.startsWith("http")
      ? letterhead.footerImage
      : imageToBase64(letterhead.footerImage))
    : "";




  // HTML Content
  const html = `
    <html>
      <head>
        <meta charset="UTF-8"/>
      <style>
  /* Page setup */
  @page {
    size: A4;
    margin: 0mm;
  }

  body {
    margin: 0;
    padding: 0;
    padding-bottom: 160px; /* ✅ reserve space for fixed footer */
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    color: #000;
    line-height: ${spacing};
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    padding: 0;
  }

  /* Capitalize helper */
  .cap-text {
    text-transform: capitalize;
  }

  /* ✅ FIXED FOOTER (always at bottom) */
  .fixed-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: #fff;
    border-top: 1px solid #d1d5db;
  }

  .footer-inner {
    width: 100%;
    padding: 6px 8px 0 8px;
    box-sizing: border-box;
  }
</style>

      </head>
      <body>
      <div id="page-height-detector" style="visibility:hidden; position:absolute; top:0;">
</div>

        <table style="width:100%; border-collapse:collapse; margin-top:0; padding-top:0;">

          
          <thead>
            <tr>
              <th style=" background:#fff; border-bottom:1px solid #d1d5db;">
                <!-- Header -->
                ${printSetting.withLetterhead ? `
                  <div style="display:flex; justify-content:center; align-items:center; width:100%;
                 ${letterheadSettings.setAsDefault ? "" : `height:${letterheadSettings.headerHeight || 30}cm;`}
                ">
  <img 
  src="${headerImageSrc}" 
  alt="Header" 
  style="width:100%; height:auto; object-fit:cover; margin:0; padding:0; display:block;" 
/>

</div>
                 ` : "" }
                

                


                <div style="
  margin-top:6px;
  border:1px solid #000;
  padding:6px;
  margin:4px;
  background:#fff;
  font-size:${printSetting?.design?.fontSize || 12}px;
  display:flex;
  justify-content:space-between;
  align-items:center;
">

  <!-- LEFT COLUMN -->
  <div style="display:flex; flex-direction:column; align-items:flex-start;">
    <p style="margin:2px 0; font-weight:600;">
      Patient: ${patient.firstName} ${patient.lastName}
    </p>
    <p style="margin:2px 0; font-weight:600;">
      Age/Sex: ${patient.age} ${patient.ageUnit || "Yrs"} / ${patient.sex}
    </p>
    <p style="margin:2px 0; font-weight:600;">
      Referred By: ${patient.doctor || "—"}
    </p>
  </div>

  <!-- RIGHT COLUMN -->
  <div style="display:flex; flex-direction:column; text-align:right; align-items:flex-start;">
    <p style="margin:2px 0; font-weight:600;">
      Date: ${new Date(reportData.createdAt).toLocaleDateString("en-GB")}
    </p>

    <p style="margin:2px 0; font-weight:600;">
      Time: ${new Date(reportData.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  })}
    </p>

    <p style="margin:2px 0; font-weight:600;">
      PAT ID /UHID: ${patient.regNo} / ${patient.uhid}
    </p>

    
  </div>
  <div style="display:flex; flex-direction:column; text-align:right; align-items:flex-start;">
    ${printSetting?.showHide?.showTATTime
        ? `
      <p style="margin-left:10px; font-weight:600;">
        TAT: ${calculateTAT(reportData.createdAt, reportData.updatedAt)}
      </p>
      `
        : ""
      }

    
  </div>

  <!-- BARCODE -->
  
        
      <div style="margin-left:10px;">
        <img 
          src="data:image/png;base64,${barcodeBase64}" 
          style="height:40px; width:auto;" 
        />
      </div>
      

  <!-- TAT -->
  

</div>



              </th>
            </tr>
          </thead>
          

          <tbody>
            <tr>
              <td style="padding:${letterheadSettings.caseInfoHeight || 3}mm;">

  ${reportData.categories
    ?.map(cat => `
        <div class="result-page">
            ${renderCategorySection(
              cat,
              design,
              spacing,
              fontSize,
              fontFamily,
              useHLMarkers,
              categoryNewFlag,
              capetalizeTestFlag
            )}
        </div>
    `)
    .join('')}

</td>

            </tr>
          </tbody>

          
         


          

        </table>
      </body>

      <div class="fixed-footer">

  <div class="footer-inner">

    <!-- SIGNATURE + QR -->
    <div style="
      width:100%;
      display:flex;
      justify-content:space-between;
      align-items:flex-end;
      height:90px;
    ">

      <!-- LEFT SIGN -->
      <div style="width:33%; text-align:center;">
        ${signatures[0] ? `
          <img src="${signatures[0].imageUrl}" style="height:55px;" />
          <div style="font-size:10px; font-weight:600;">${signatures[0].name}</div>
          <div style="font-size:9px;">${signatures[0].designation || ""}</div>
        ` : ""}
      </div>

      <!-- CENTER QR -->
      <div style="width:34%; text-align:center;">
        ${
          printSetting?.showHide?.showQRCode && qrBase64
            ? `
              <img src="${qrBase64}" style="height:70px;" />
              <div style="font-size:10px;">Scan to view report</div>
            `
            : ""
        }
      </div>

      <!-- RIGHT SIGN -->
      <div style="width:33%; text-align:center;">
        ${signatures[1] ? `
          <img src="${signatures[1].imageUrl}" style="height:55px;" />
          <div style="font-size:10px; font-weight:600;">${signatures[1].name}</div>
          <div style="font-size:9px;">${signatures[1].designation || ""}</div>
        ` : ""}
      </div>

    </div>

    <!-- FOOTER IMAGE -->
    ${
      printSetting.withLetterhead && footerImageSrc
        ? `
          <img
            src="${footerImageSrc}"
            style="width:100%; height:auto; display:block; margin-top:4px;"
          />
        `
        : ""
    }

  </div>
</div>


      

    </html>
  `;

// ----- Detect natural content height -----
const height = await page.evaluate(() => {
    return document.body.scrollHeight;  // total HTML height in px
});

// PDF A4 height in Playwright = 1123px approx
const A4_HEIGHT = 1123;

const totalPages = Math.ceil(height / A4_HEIGHT);

console.log("Detected Pages:", totalPages);

// Select footer class
const footerClass =
  totalPages === 1 ? "page-footer-fixed" : "page-footer-normal";

// Replace class
const finalHTML = html.replace(/{{FOOTER_CLASS}}/g, footerClass);

// Re-render HTML with correct footer
await page.setContent(finalHTML, { waitUntil: "load" });




  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,

    headerTemplate: `<div></div>`,  // no header

    footerTemplate: `
    <div style="
      font-size:11px;
      color:#444;
      width:100%;
      text-align:right;
      padding-right:20px;
      margin-top:-40px;   /* move upward (above footer image) */
    ">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,

    margin: {
      top: "0mm",
      bottom: "20mm"   // allow page number area to exist
    }
  });






  await page.close();


  console.log("Type of pdfBuffer:", typeof pdfBuffer);     // object
  console.log("Is Buffer:", Buffer.isBuffer(pdfBuffer));   // true
  console.log("PDF Buffer length:", pdfBuffer.length);

  return pdfBuffer;

};
