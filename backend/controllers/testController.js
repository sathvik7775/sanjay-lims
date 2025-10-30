import ReferenceRange from "../models/ReferenceRange.js";
import Test from "../models/Test.js";
import TestRequest from "../models/TestRequest.js";


/**
 * @desc List all global active tests (for admin & branch)
 */
export const listGlobalTests = async (req, res) => {
  try {
    const tests = await Test.find({ status: "Active" }).sort({ createdAt: -1 });

    console.log("Fetched Global Tests:", tests);
    return res.status(200).json({ success: true, tests });
    
    
  } catch (err) {
    console.error("Error fetching global tests:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get a single global test by ID (Admin only)
 */
export const getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("editcjvdfcdfcvndfvc", id);
    

    // Find the test by ID
    const test = await Test.findById(id);
   
    
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    return res.status(200).json({ success: true, data: test });
  } catch (err) {
    console.error("Error fetching test by ID:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};




/**
 * @desc Add new test
 * - Admin: directly global
 * - Branch: creates a request
 */
export const addTest = async (req, res) => {
  console.log(req.body);
  console.log(req.userType);
  console.log(req.branchId);
  
  try {
    const { name, type, category, price, method, instrument, interpretation, parameters, shortName, unit, defaultResult, isFormula } = req.body;
    const userType = req.userType; // "admin" or "branch"
    const branchId = req.branchId || null;

    if (!name || !type) return res.status(400).json({ success: false, message: "Test name and type are required" });

    // Check if test already exists globally
    const existing = await Test.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existing) return res.status(400).json({ success: false, message: "Test already exists globally" });

    if (userType === "admin") {
      // ✅ Admin adds directly to global Test
      const newTest = new Test({
        name,
        type,
        shortName,
        unit,
        category,
        price,
        method,
        defaultResult,
        instrument,
        interpretation,
        parameters,
        status: "Active",
        createdBy: "admin",
        isFormula: isFormula || false,
      });
      await newTest.save();
      return res.status(201).json({ success: true, message: "Test added globally", data: newTest });
    } else {
      // ✅ Branch creates a request
      if (!branchId) return res.status(400).json({ success: false, message: "branchId is required for branch requests" });

      const existingRequest = await TestRequest.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, branchId });
      if (existingRequest) return res.status(400).json({ success: false, message: "You already requested this test" });

      const newRequest = new TestRequest({
        name,
        type,
        unit,
        category,
        price,
        method,
        defaultResult,
        instrument,
        interpretation,
        parameters,
        branchId,
        status: "Pending",
        isFormula: isFormula || false,
      });
      await newRequest.save();
      return res.status(201).json({ success: true, message: "Test request sent", data: newRequest });
    }
  } catch (err) {
    console.error("Error adding test:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Admin approves/rejects a branch test request
 */
export const handleTestRequest = async (req, res) => {
  try {
    const { id } = req.params; // request id
    const { status } = req.body; // "Approved" or "Rejected"

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const request = await TestRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = status;
    await request.save();

    if (status === "Approved") {
      const newTest = new Test({
        name: request.name,
        type: request.type,
        unit: request.unit,
        category: request.category,
        price: request.price,
        method: request.method,
        defaultResult: request.defaultResult,
        instrument: request.instrument,
        interpretation: request.interpretation,
        parameters: request.parameters,
        status: "Active",
        createdBy: "admin",
        isFormula: request.isFormula || false,
      });
      await newTest.save();
    }

    return res.status(200).json({ success: true, message: `Request ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Error handling test request:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Delete a global test (Admin only)
 */
export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findByIdAndDelete(id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    return res.status(200).json({ success: true, message: "Test deleted successfully" });
  } catch (err) {
    console.error("Error deleting test:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Edit an existing global test (Admin only)
 */
export const editTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, category, price, method, instrument, interpretation, parameters, shortName, unit, defaultResult, isFormula } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: "Test name and type are required" });
    }

    // Check if the test exists
    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    // Check for duplicate name
    const existing = await Test.findOne({ _id: { $ne: id }, name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existing) return res.status(400).json({ success: false, message: "Test name already exists" });

    // Update test
    test.name = name;
    test.type = type;
    test.unit = unit;
    test.shortName = shortName;
    test.category = category;
    test.defaultResult = defaultResult;
    test.price = price;
    test.method = method;
    test.instrument = instrument;
    test.interpretation = interpretation;
    test.parameters = parameters;
    test.isFormula = isFormula || false;
    await test.save();

    return res.status(200).json({ success: true, message: "Test updated successfully", data: test });
  } catch (err) {
    console.error("Error editing test:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};





/**
 * @desc List all pending test requests
 */
export const listTestRequests = async (req, res) => {
  try {
    const requests = await TestRequest.find({ status: "Pending" }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching test requests:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get all reference ranges for a test by testId
 */
export const getReferenceRangesByTestId = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!testId)
      return res.status(400).json({ success: false, message: "testId is required" });

    const ranges = await ReferenceRange.find({ testId }).sort({ minAge: 1 });

    if (!ranges || ranges.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No reference ranges found for this test",
      });
    }

    return res.status(200).json({ success: true, data: ranges });
  } catch (err) {
    console.error("Error fetching reference ranges by testId:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Add new reference ranges for a test (Numeric & Text)
 */
export const addReferenceRanges = async (req, res) => {
  try {
    const { testId, testName, parameterId, parameterName, ranges } = req.body;

    if (!testId || !ranges || !Array.isArray(ranges)) {
      return res.status(400).json({
        success: false,
        message: "testId and ranges (array) are required",
      });
    }

    const newRanges = ranges.map((r) => {
      const base = {
        testId,
        testName,
        parameterId: parameterId || null,
        parameterName: parameterName || null,
        which: r.type || "Numeric",
      };

      if (r.type === "Text") {
        return {
          ...base,
          textValue: r.textValue || "",
          displayText: r.displayText || r.textValue || "-",
          sex: "Any",
          minAge: 0,
          minUnit: "Years",
          maxAge: 0,
          maxUnit: "Years",
          lower: null,
          upper: null,
        };
      }

      // Numeric type
      return {
        ...base,
        sex: r.sex || "Any",
        minAge: r.minAge ?? 0,
        minUnit: r.minUnit || "Years",
        maxAge: r.maxAge ?? 0,
        maxUnit: r.maxUnit || "Years",
        lower: r.lower ?? null,
        upper: r.upper ?? null,
        displayText: r.displayText || "-",

        textValue: null,
      };
    });

    const savedRanges = await ReferenceRange.insertMany(newRanges);

    return res.status(201).json({
      success: true,
      message: "Reference ranges added successfully",
      data: savedRanges,
    });
  } catch (err) {
    console.error("Error adding reference ranges:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Replace existing reference ranges with new ones
 */
export const updateReferenceRange = async (req, res) => {
  try {
    const { testId, testName, parameterId, parameterName, ranges } = req.body;

    if (!testId || !testName || !ranges || !Array.isArray(ranges)) {
      return res.status(400).json({
        success: false,
        message: "testId, testName and ranges (array) are required",
      });
    }

    // Delete all existing ranges for this test/parameter
    await ReferenceRange.deleteMany({ testId, parameterId: parameterId || null });

    // Prepare new ranges for creation
    const createData = ranges.map((r) =>
      r.type === "Text"
        ? {
            testId,
            testName,
            parameterId: parameterId || null,
            parameterName: parameterName || null,
            which: "Text",
            textValue: r.textValue || "",
            displayText: r.displayText || r.textValue || "-",
            sex: "Any",
            minAge: 0,
            minUnit: "Years",
            maxAge: 0,
            maxUnit: "Years",
            lower: null,
            upper: null,
          }
        : {
            testId,
            testName,
            parameterId: parameterId || null,
            parameterName: parameterName || null,
            which: "Numeric",
            sex: r.sex || "Any",
            minAge: r.minAge ?? 0,
            minUnit: r.minUnit || "Years",
            maxAge: r.maxAge ?? 0,
            maxUnit: r.maxUnit || "Years",
            lower: r.lower ?? null,
            upper: r.upper ?? null,
            displayText: r.displayText || "-",

            textValue: null,
          }
    );

    // Create all new ranges
    const createdRanges = await ReferenceRange.insertMany(createData);

    return res.status(200).json({
      success: true,
      message: "Reference ranges replaced successfully",
      data: createdRanges,
    });
  } catch (err) {
    console.error("Error updating reference ranges:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * @desc Delete a reference range
 */
export const deleteReferenceRange = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ReferenceRange.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Reference range not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Reference range deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting reference range:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc List all reference ranges
 */
export const listReferenceRanges = async (req, res) => {
  try {
    const ranges = await ReferenceRange.find().sort({
      testId: 1,
      parameterName: 1,
      minAge: 1,
    });

    console.log(ranges);
    

    return res.status(200).json({
      success: true,
      count: ranges.length,
      data: ranges,
    });
  } catch (err) {
    console.error("Error listing reference ranges:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
