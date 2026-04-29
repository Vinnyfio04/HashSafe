// mongoDB connection

import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // await mongoose.connect(/*MongoDB URL*/)
        console.log("MongoDB Connected Successfully!")
    } catch (error) {
        console.log("MongoDB Connection Failed: ", error.message)
        process.exit(1)
    }
};

export default connectDB;