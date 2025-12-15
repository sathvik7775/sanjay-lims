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




  const html = `
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      color: #000;
      line-height: ${spacing};
    }

    /* ===== PAGE LAYOUT ===== */
    .page {
      height: 1123px; /* A4 height */
      display: flex;
      flex-direction: column;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* ===== HEADER ===== */
    .header {
      flex-shrink: 0;
      height: ${letterheadSettings.headerHeight || 160}px;
      border-bottom: 1px solid #d1d5db;
    }

    /* ===== CONTENT ===== */
    .content {
      flex: 1;
      padding: ${letterheadSettings.caseInfoHeight || 6}mm;
      overflow: hidden;
    }

    /* ===== FOOTER ===== */
    .footer {
      flex-shrink: 0;
      height: 170px;
      border-top: 1px solid #d1d5db;
      padding: 6px 10px;
      box-sizing: border-box;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    /* ===== FOOTER INTERNAL ===== */
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .footer-col {
      width: 33%;
      text-align: center;
    }

    .footer-col img {
      height: 45px;
    }

    .footer-img {
      width: 100%;
      margin-top: 4px;
    }

    /* Avoid splitting */
    .avoid-break {
      page-break-inside: avoid;
    }
  </style>
</head>

<body>

<div class="page">

  <!-- ================= HEADER ================= -->
  <div class="header">

    ${printSetting.withLetterhead ? `
      <img
        src="${headerImageSrc}"
        style="width:100%; height:auto; display:block;"
      />
    ` : ""}

    <div style="
      margin:4px;
      border:1px solid #000;
      padding:6px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      font-size:${printSetting?.design?.fontSize || 12}px;
    ">

      <div>
        <div><b>Patient:</b> ${patient.firstName} ${patient.lastName}</div>
        <div><b>Age/Sex:</b> ${patient.age} ${patient.ageUnit || "Yrs"} / ${patient.sex}</div>
        <div><b>Referred By:</b> ${patient.doctor || "—"}</div>
      </div>

      <div>
        <div><b>Date:</b> ${new Date(reportData.createdAt).toLocaleDateString("en-GB")}</div>
        <div><b>Time:</b> ${new Date(reportData.createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })}</div>
        <div><b>PAT ID / UHID:</b> ${patient.regNo} / ${patient.uhid}</div>
      </div>

      <div>
        <img src="data:image/png;base64,${barcodeBase64}" style="height:40px;" />
      </div>

    </div>
  </div>

  <!-- ================= CONTENT ================= -->
  <div class="content">
    ${reportData.categories
      ?.map(cat => `
        <div class="avoid-break">
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
      .join("")}
  </div>

  <!-- ================= FOOTER ================= -->
  <div class="footer">

    <div class="footer-row">

      <div class="footer-col">
        ${signatures[0] ? `
          <img src="${signatures[0].imageUrl}" />
          <div>${signatures[0].name}</div>
        ` : ""}
      </div>

      <div class="footer-col">
        ${printSetting?.showHide?.showQRCode && qrBase64 ? `
          <img src="${qrBase64}" />
          <div>Scan to view report</div>
        ` : ""}
      </div>

      <div class="footer-col">
        ${signatures[1] ? `
          <img src="${signatures[1].imageUrl}" />
          <div>${signatures[1].name}</div>
        ` : ""}
      </div>

    </div>

    ${
      printSetting.withLetterhead && footerImageSrc
        ? `<img src="${footerImageSrc}" class="footer-img" />`
        : ""
    }

  </div>

</div>

</body>
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

  headerTemplate: `<div></div>`,

  footerTemplate: `
  <div style="
    width:100%;
    font-size:10px;
    text-align:right;
    padding-right:20px;
  ">
    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
  </div>
`,


  margin: {
    top: "0mm",
    bottom: "25mm"   // 👈 enough for footerTemplate
  }
});







  await page.close();


  console.log("Type of pdfBuffer:", typeof pdfBuffer);     // object
  console.log("Is Buffer:", Buffer.isBuffer(pdfBuffer));   // true
  console.log("PDF Buffer length:", pdfBuffer.length);

  return pdfBuffer;

};
