import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer, { type FileFilterCallback } from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../Images");
    console.log("Upload Path:", uploadPath);
    console.log("File:1");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false); // No error, just reject the file
  }
};

// Initialize multer
export const upload = multer({ storage, fileFilter });

// Controller to handle the uploaded file
export const uploadProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Invalid file type or no file provided" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      file: file.filename,
      path: file.path,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
