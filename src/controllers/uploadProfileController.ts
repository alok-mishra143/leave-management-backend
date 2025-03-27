import type { Request, Response } from "express";
import { db } from "../db/prismaClient";
import cloudinary from "cloudinary";
import multer, { type FileFilterCallback } from "multer";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG files are allowed"));
  }
};

export const cloudMulter = multer({ storage, fileFilter });

export const CloudProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const file = req.file;
    const { id } = req.user;

    if (!file || !id) {
      res.status(400).json({ error: "Invalid file or userId missing" });
      return;
    }

    const user = await db.user.findUnique({
      where: { id: id },
      select: { image: true },
    });

    if (user && user.image) {
      const publicId = user.image.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.v2.uploader.destroy(`profile_images/${publicId}`);
      }
    }

    const result = await cloudinary.v2.uploader.upload_stream(
      {
        folder: "profile_images",
        use_filename: true,
        unique_filename: false,
      },
      async (error, result) => {
        if (error) {
          res.status(500).json({ error: error.message });
          return;
        }

        if (result && result.secure_url) {
          await db.user.update({
            where: { id: id },
            data: { image: result.secure_url },
          });

          res.status(200).json({
            success: true,
            message: "File uploaded to Cloudinary and URL stored successfully",
            fileUrl: result.secure_url,
          });
        }
      }
    );

    if (file.buffer) {
      const readableStream = require("stream").Readable.from(file.buffer);
      readableStream.pipe(result);
    } else {
      res.status(400).json({ error: "File buffer is empty" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
