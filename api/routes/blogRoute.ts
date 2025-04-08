import { Router } from "express";
import {
  createBlogs,
  deleteBlog,
  getAllBlogs,
  updateBlog,
} from "../controllers/blogControllers";
import { auth } from "../middleware/auth";
import { Role } from "../constants/Meassage";

const blogRouter = Router();

blogRouter.post("/", auth([Role.ADMIN, Role.STUDENT]), createBlogs);
blogRouter.get("/", auth([Role.ADMIN, Role.STUDENT]), getAllBlogs);
blogRouter.patch("/:id", auth([Role.ADMIN, Role.STUDENT]), updateBlog);
blogRouter.delete("/:id", auth([Role.ADMIN, Role.STUDENT]), deleteBlog);

export default blogRouter;
