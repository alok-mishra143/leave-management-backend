import express from "express";
import router from "./src/routes";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 9000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(router);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
