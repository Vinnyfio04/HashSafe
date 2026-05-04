// .mjs file for ES6 module syntax, different from professors example which uses CommonJS syntax (.js files with require and module.exports)
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routers/auth.mjs";
import usersRouter from "./routers/users.mjs";
import contentRouter from "./routers/content.mjs";
import hashRouter from "./routers/hash.mjs";

const app = express();
const PORT = 3000;

// Connect to the database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '150mb' }));

// Routes
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/content", contentRouter);
app.use("/hash", hashRouter);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


