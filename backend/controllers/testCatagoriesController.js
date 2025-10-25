import TestCategory from "../models/TestCategory.js";
import CategoryRequest from "../models/CategoryRequest.js";

/**
 * @desc List all global active categories (for admin & branch)
 */
export const listGlobalCategories = async (req, res) => {
  try {
    const categories = await TestCategory.find({ status: "Active" }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, categories });
  } catch (err) {
    console.error("Error fetching global categories:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Add new category
 * - Admin: directly global
 * - Branch: creates a request
 */
export const addCategory = async (req, res) => {
  console.log(req.body);
  console.log(req.userType);
  console.log(req.branchId);
  
  try {
    const { name } = req.body;
    const userType = req.userType; // "admin" or "branch"
    const branchId = req.branchId || null;

    if (!name) return res.status(400).json({ success: false, message: "Category name is required" });

    // Check if category already exists globally
    const existing = await TestCategory.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existing) return res.status(400).json({ success: false, message: "Category already exists globally" });

    if (userType === "admin") {
      // ✅ Admin adds directly to global TestCategory
      const newCategory = new TestCategory({ name, status: "Active", createdBy: "admin" });
      await newCategory.save();
      return res.status(201).json({ success: true, message: "Category added globally", data: newCategory });
    } else {
      // ✅ Branch creates a request
      if (!branchId) return res.status(400).json({ success: false, message: "branchId is required for branch requests" });

      const existingRequest = await CategoryRequest.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, branchId });
      if (existingRequest) return res.status(400).json({ success: false, message: "You already requested this category" });

      const newRequest = new CategoryRequest({ name, branchId, status: "Pending" });
      await newRequest.save();
      return res.status(201).json({ success: true, message: "Category request sent", data: newRequest });
    }
  } catch (err) {
    console.error("Error adding category:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
/**
 * @desc Admin approves/rejects a branch category request
 */
export const handleCategoryRequest = async (req, res) => {
  console.log(req.body);
  
  try {
    const { id } = req.params; // request id
    const { status } = req.body; // "Approved" or "Rejected"

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const request = await CategoryRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = status;
    await request.save();

    if (status === "Approved") {
      const newCategory = new TestCategory({ name: request.name, status: "Active", createdBy: "admin" });
      await newCategory.save();
    }

    return res.status(200).json({ success: true, message: `Request ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Error handling category request:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Delete a global category (Admin only)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await TestCategory.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });

    return res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Edit an existing global category (Admin only)
 */
export const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Check if the category exists
    const category = await TestCategory.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Check for duplicate name
    const existing = await TestCategory.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Category name already exists" });
    }

    // Update category
    category.name = name;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    console.error("Error editing category:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


/**
 * @desc List all pending branch category requests (Admin only)
 */
export const listCategoryRequests = async (req, res) => {
  try {
    const requests = await CategoryRequest.find({ status: "Pending" }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching category requests:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

