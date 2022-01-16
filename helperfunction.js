import { client } from "./index.js";
import bcrypt from "bcrypt";
import { customAlphabet } from "nanoid";
import { ObjectId } from "mongodb";

async function Getuser(values) {
  return await client.db("urlshort").collection("users").findOne(values);
}
async function Createuser(values) {
  return await client.db("urlshort").collection("users").insertOne(values);
}
async function genpassword(Password) {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashpassword = await bcrypt.hash(Password, salt);
  return hashpassword;
}
async function updateUser({ Username, token }) {
  await client
    .db("urlshort")
    .collection("users")
    .updateOne({ Username: Username }, { $set: { token: token } });
}
async function activateuser({ token }) {
  await client
    .db("urlshort")
    .collection("users")
    .updateOne({ token: token }, { $set: { Status: "Active" } });
}
async function updatePass({ email: email, password: hashedpassword }) {
  await client
    .db("urlshort")
    .collection("users")
    .updateOne({ email: email }, { $set: { Password: hashedpassword } });
}

export {
  Getuser,
  Createuser,
  genpassword,
  updateUser,
  activateuser,
  updatePass,
};

async function createData(urlData) {
  return await client.db("urlshort").collection("urls").insertOne(urlData);
}

async function findUrl(url) {
  return await client.db("urlshort").collection("urls").findOne(url);
}

async function findManyUrl(userData) {
  return await client.db("urlshort").collection("urls").find(userData).toArray();
}

async function updateLog(urlData) {
  const { longUrl, usedCount } = urlData;
  return await client
    .db("urlshort")
    .collection("urls")
    .updateOne({ longUrl }, { $set: { usedCount } });
}

async function deleteUrl(id) {
  return await client
    .db("urlshort")
    .collection("urls")
    .deleteOne({ _id: ObjectId(id) });
}

async function updateUrl(userData) {
  const { _id, shortUrl, shortString, lastUpdated } = userData;
  return await client
    .db("urlshort")
    .collection("urls")
    .updateOne({ _id }, { $set: { shortUrl, shortString, lastUpdated } });
}

function urlGenereator() {
  const nanoid = customAlphabet(
    "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    10
  );
  return nanoid();
}

export {
  findUrl,
  findManyUrl,
  urlGenereator,
  createData,
  updateLog,
  deleteUrl,
  updateUrl,
};
