import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  const uri = env.mongoUri;
  // Mongoose 8: no need for useNewUrlParser
  await mongoose.connect(uri);
  console.log(`[db] connected to ${uri.replace(/:\/\/.*@/, "://***@")}`);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
