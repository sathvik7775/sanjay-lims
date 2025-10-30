import express from "express";
import {
  createFormula,
  getAllFormulas,
  getFormulaByTestId,
  updateFormula,
  deleteFormula,
} from "../controllers/formulaController.js";

// ✅ Use formulaRouter instead of router
const formulaRouter = express.Router();

/**
 * @route   POST /api/formula
 * @desc    Create a new formula for a test
 */
formulaRouter.post("/", createFormula);

/**
 * @route   GET /api/formula
 * @desc    Get all formulas
 */
formulaRouter.get("/", getAllFormulas);

/**
 * @route   GET /api/formula/:testId
 * @desc    Get formula by test ID
 */
formulaRouter.get("/:testId", getFormulaByTestId);

/**
 * @route   PUT /api/formula/:id
 * @desc    Update an existing formula
 */
formulaRouter.put("/:id", updateFormula);

/**
 * @route   DELETE /api/formula/:id
 * @desc    Delete formula
 */
formulaRouter.delete("/:id", deleteFormula);

export default formulaRouter;
