// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

// ... import your routes
import adminLoginRouter from "./routes/adminloginroute.js";
import adminBranchRouter from "./routes/adminbranchroute.js";
import branchLoginRouter from "./routes/branchLoginRouter.js";
import branchDataRoute from "./routes/branchDataRoute.js";
import testCategoryRouter from "./routes/testCategoryRoutes.js";
import testRouter from "./routes/testRoute.js";
import panelRouter from "./routes/testPanelRoute.js";
import packageRouter from "./routes/testPackageRoute.js";
import letterheadRouter from "./routes/letterHeadRoute.js";
import signatureRouter from "./routes/signatureRoute.js";
import caseRouter from "./routes/caseRoute.js";
import resultRouter from "./routes/resultRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import agentRouter from "./routes/agentRoute.js";
import printRouter from "./routes/printRoutes.js";
import pdfRouter from "./routes/pdfRoute.js";


dotenv.config();

const app = express();
const server = http.createServer(app);

// 🌐 Socket.IO setup
export const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with frontend URL
    methods: ["GET", "POST"],
  },
});

// 🌐 Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


// 📦 Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// 🧠 Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 🏥 Base API route
app.get("/", (req, res) => {
  res.send("🔬 LIMS Backend Server Running Successfully 🚀");
});

// 🧩 Routes
app.use("/api/adminlogin", adminLoginRouter);
app.use("/api/admin/branch", adminBranchRouter);
app.use("/api/branchlogin", branchLoginRouter);
app.use("/api/branchData", branchDataRoute);
app.use("/api/test/category", testCategoryRouter);
app.use("/api/test/database", testRouter);
app.use("/api/test/panels", panelRouter);
app.use("/api/test/packages", packageRouter);
app.use("/api/report/letterhead", letterheadRouter);
app.use("/api/report/signature", signatureRouter);
app.use("/api/cases", caseRouter);
app.use("/api/results", resultRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/agents", agentRouter);
app.use("/api/print", printRouter);
app.use("/api/pdf", pdfRouter);



// 🚀 Start server
server.listen(PORT, () => {
  console.log(`🌍 Server running on http://localhost:${PORT}`);
});
