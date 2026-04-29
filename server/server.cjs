const express = require("express");
const app = express();
app.use(express.json());
const PORT = 3000;

// Routers
const contentRouter = require("./routers/content.cjs");

// Routes
app.use("/content", contentRouter)



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})