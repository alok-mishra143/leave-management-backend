import adminRoute from "./adminRoute";
import studentRoute from "./studentRoute";
import authRoute from "./authRoute";
import leaveRouter from "./leaveRoute";
import uploadRouter from "./uploadRoute";
import blogRouter from "./blogRoute";
import express from "express";
const router = express.Router();

const allRoutes = [
  { path: "/", route: adminRoute, name: "admin" },
  { path: "/", route: studentRoute, name: "student" },
  { path: "/", route: authRoute, name: "auth" },
  { path: "/", route: leaveRouter, name: "leave" },
  { path: "/", route: uploadRouter, name: "upload" },
];

allRoutes.forEach((route) => {
  console.log("this Route is online ✅ ", route.name, route.path);
  router.use(route.route);
});

router.use("/blogs", blogRouter);

export default router;
