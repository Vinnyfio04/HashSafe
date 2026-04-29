import express from "express";
const app = express();
app.use(express.json());
const PORT = 3000;

// Routers
import contentRouter from "./routers/content.mjs";

// Routes
app.use("/content", contentRouter)



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
