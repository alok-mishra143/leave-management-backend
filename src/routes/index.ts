import adminRoute from "./adminRoute";
import studentRoute from "./studentRoute";
import authRoute from "./authRoute";
import express from 'express';
const router = express.Router();

const allRoutes=[
    {path:'/',route:adminRoute,name:'admin'},
    {path:'/',route:studentRoute,name:'student'},
    {path:'/',route:authRoute,name:'auth'}
]

allRoutes.forEach(route=>{
    console.log("this Route is online ✅ ",route.name)
    router.use('/api',route.route)
})

export default router;