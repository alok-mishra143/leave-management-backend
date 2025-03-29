import { Router } from "express";
import {
  upload,
  uploadProfileImage,
} from "../controllers/profileImageControllers";
import { auth } from "../middleware/auth";
import { Role } from "../constants/Meassage";
import {
  cloudMulter,
  CloudProfile,
} from "../controllers/uploadProfileController";

const uploadRouter = Router();

// uploadRouter.post(
//   "/upload-image",
//   auth([Role.ADMIN, Role.HOD, Role.STAFF, Role.STUDENT]),
//   upload.single("image"),
//   uploadProfileImage
// );

uploadRouter.post(
  "/upload-image",
  auth([Role.ADMIN, Role.HOD, Role.STAFF, Role.STUDENT]),
  cloudMulter.single("image"),
  CloudProfile
);

// uploadRouter.get(
//   "/get-profile",
//   auth([Role.ADMIN, Role.HOD, Role.STAFF, Role.STUDENT]),
//   getProfileImage
// );

export default uploadRouter;
