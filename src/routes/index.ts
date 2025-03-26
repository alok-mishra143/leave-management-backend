import adminRoute from "./adminRoute";
import studentRoute from "./studentRoute";
import authRoute from "./authRoute";
import leaveRouter from "./leaveRoute";
import express from "express";
const router = express.Router();

const allRoutes = [
  { path: "/", route: adminRoute, name: "admin" },
  { path: "/", route: studentRoute, name: "student" },
  { path: "/", route: authRoute, name: "auth" },
  { path: "/", route: leaveRouter, name: "leave" },
];

allRoutes.forEach((route) => {
  console.log("this Route is online ✅ ", route.name);
  router.use(route.route);
});

export default router;
