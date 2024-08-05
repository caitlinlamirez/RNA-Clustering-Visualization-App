import express from "express";
import cors from "cors" ;
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import {  MainRouter } from '../routes/routes.js';

// Configure dotenv to load the .env file
configDotenv();
const databaseConnectionString = process.env.DATABASE_CONNECTION_STRING
const databasePort = process.env.DATABASE_PORT

const app = express();

app.use(express.json());
app.use(cors());

app.use("/values", MainRouter)

mongoose.connect(databaseConnectionString);


app.listen(databasePort, () => console.log(`Server on Port ${databasePort} is running! `))
