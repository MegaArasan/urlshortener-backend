import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import { userRouter } from "./routes/users.js";
import { urlRouter } from "./routes/url.js";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();
app.use(bodyParser.json());
export const Base_URL = "http://localhost:2000/";

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT;

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  client.connect();
  console.log("MONGODB is connected");
  return client;
}

export const client = await createConnection();

app.listen(PORT, () => console.log("MONGO DB is connected in PORT:" + PORT));

app.get("/", (req, res) => {
  res.send({ Msg: "Server is up and start running" });
});
app.use("/users", userRouter);
app.use("/", urlRouter);
