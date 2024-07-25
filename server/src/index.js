import express from "express";
import cors from "cors" ;
import mongoose from "mongoose";
import {  MainRouter } from '../routes/routes.js';

const app = express();

app.use(express.json());
app.use(cors());

app.use("/values", MainRouter)

mongoose.connect(
  "mongodb+srv://caitlinlamirez:yywVTgcJOC1H5zMI@visualization-cluster.nsvcb6a.mongodb.net/?retryWrites=true&w=majority&appName=visualization-cluster"
  );


app.listen(3005, () => console.log("Server on Port 3005 Started!"))
