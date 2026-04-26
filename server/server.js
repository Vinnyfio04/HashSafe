const express = require("express");
const app = express();
app.use(express.json());
const PORT = 3000;
const contentRouter = require("./routers/content")

app.use("/content", contentRouter)