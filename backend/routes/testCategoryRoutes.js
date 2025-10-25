import express from "express";
import { verifyBranchToken } from "../middlewares/branchAuth.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { addCategory,
    listGlobalCategories,
  deleteCategory,
  handleCategoryRequest,
  listCategoryRequests,
  editCategory, } from "../controllers/testCatagoriesController.js";

const testCategoryRouter = express.Router();

/**
 * ------------------------------
 * GLOBAL TEST CATEGORY ROUTES
 * ------------------------------
 */

// Admin adds global category, Branch sends request
testCategoryRouter.post("/add", verifyBranchToken, addCategory); // branch sends request
testCategoryRouter.post("/admin/add", verifyAdminToken, addCategory); // admin adds global

// List global categories (for both admin and branch)
testCategoryRouter.get("/list", verifyBranchToken, listGlobalCategories);
testCategoryRouter.get("/admin/list", verifyAdminToken, listGlobalCategories);

// Admin deletes a global category
testCategoryRouter.delete("/admin/delete/:id", verifyAdminToken, deleteCategory);

/**
 * ------------------------------
 * BRANCH CATEGORY REQUEST ROUTES
 * ------------------------------
 */

// Admin lists pending branch category requests
testCategoryRouter.get("/admin/requests", verifyAdminToken, listCategoryRequests);

// Admin approves/rejects a branch category request
testCategoryRouter.put("/admin/requests/:id", verifyAdminToken, handleCategoryRequest);

testCategoryRouter.put("/admin/edit/:id", verifyAdminToken, editCategory);

export default testCategoryRouter;

