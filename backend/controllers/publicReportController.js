import Report from "../models/Report.js";

export const publicReportPage = async (req, res) => {
  try {
    const { token } = req.params;

    const report = await Report.findOne({
      publicToken: token,
      publicActive: true
    });

    if (!report) {
      return res.status(404).send("<h2>Invalid or expired report link</h2>");
    }

    res.send(`
      <html>
        <head>
          <title>Patient Report</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f8f9fa;
              padding: 20px;
            }
            .box {
              background: white;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 450px;
              margin: auto;
            }
            h2 { margin-bottom: 5px; }
            .label { font-weight: bold; }
            .btn {
              display: block;
              background: #007bff;
              color: white;
              padding: 12px;
              text-align: center;
              border-radius: 6px;
              margin-top: 20px;
              text-decoration: none;
              font-size: 16px;
            }
          </style>
        </head>

        <body>
          <div class="box">
            <h2>${report.patient.name}</h2>
            <p><span class="label">Age/Gender:</span> ${report.patient.age}, ${report.patient.gender}</p>

            <hr/>

            <p><span class="label">Date:</span> ${report.reportDate}</p>
            <p><span class="label">Time:</span> ${report.reportTime}</p>

            <hr/>

            <p><span class="label">Lab:</span> ${report.lab.name}</p>
            <p><span class="label">Address:</span> ${report.lab.address}</p>

            <a class="btn" href="${report.publicPdfUrl}" target="_blank">📄 Download PDF</a>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("Public Report Error:", err);
    res.status(500).send("Server error");
  }
};
