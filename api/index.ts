import express from "express";
import router from "./routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import { job } from "./cron/cronJob";
import session from "express-session";
import path from "path";
import blogRouter from "./routes/blogRoute";

const passPortSetup = require("./controllers/oAuth/oAuth");

const app = express();
const PORT = process.env.PORT || 9000;
const origin = process.env.NEXTJS_URL || "*";

app.use(__dirname, express.static(path.join(__dirname, "./src/Images")));

app.use(express.json());
app.use(
  cors({
    origin: origin,

    credentials: true,
  })
);
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(router);
// app.use("/blogs", blogRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

job.start();
