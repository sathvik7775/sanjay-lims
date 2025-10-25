import express from "express";
import { branchLogin } from "../controllers/branchLoginController.js";



const branchLoginRouter = express.Router();

branchLoginRouter.post("/login", (req, res) => {
  console.log("Branch login route hit");
  branchLogin(req, res);
});


export default branchLoginRouter;
