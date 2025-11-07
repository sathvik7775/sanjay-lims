// middlewares/uploadLetterhead.js
import multer from "multer";
import path from "path";

// ✅ Configure temporary storage
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    // Add timestamp to avoid duplicate filenames
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// ✅ File type validation (allow only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ✅ Max file size (e.g., 5MB per file)
const limits = { fileSize: 5 * 1024 * 1024 };

// ✅ Final middleware export
export const letterheadUpload = multer({
  storage,
  fileFilter,
  limits,
}).fields([
  { name: "headerImage", maxCount: 1 },
  { name: "footerImage", maxCount: 1 },
]);
