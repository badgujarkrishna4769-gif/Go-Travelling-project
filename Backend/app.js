import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import placesRoutes from "./routes/places-routes.js";
import usersRoutes from "./routes/users-routes.js";
import HttpError from "./models/http-error.js";

dotenv.config(); 

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.use(express.json());


app.use(
  "/uploads/images",
  express.static(path.join(__dirname, "uploads", "images"))
);


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});


app.use("/api/places", placesRoutes);
app.use("/api/users",  usersRoutes);


app.use((req, res, next) => {
  throw new HttpError("Could not find this route.", 404);
});


app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});


const PORT       = process.env.PORT       || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://rohit:RawKRISHak47@ac-sdsrr0p-shard-00-00.iecozmh.mongodb.net:27017,ac-sdsrr0p-shard-00-01.iecozmh.mongodb.net:27017,ac-sdsrr0p-shard-00-02.iecozmh.mongodb.net:27017/?ssl=true&replicaSet=atlas-l6qmqd-shard-0&authSource=admin&appName=GoCluster";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB!");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });
