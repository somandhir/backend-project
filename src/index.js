// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config();

connectDB();

/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("error in our app connection with db : ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(` App is listening on PORT: ${process.env.PORT}`);
    });
  } catch (e) {
    console.log("error in db connection : ", e);
    throw e;
  }
})()
*/
