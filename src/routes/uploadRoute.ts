import { Router } from "express";
import {
  upload,
  uploadProfileImage,
} from "../controllers/profileImageControllers";
import { auth } from "../middleware/auth";
import { Role } from "../constants/Meassage";

const uploadRouter = Router();

uploadRouter.post(
  "/upload-image",
  auth([Role.ADMIN, Role.HOD, Role.STAFF, Role.STUDENT]),
  upload.single("image"),
  uploadProfileImage
);

export default uploadRouter;
