import validUrl from "valid-url";
import express from "express";
import { ObjectId } from "mongodb";
import {
  findUrl,
  findManyUrl,
  urlGenereator,
  createData,
  updateLog,
  deleteUrl,
  updateUrl,
} from "../helperfunction.js";
import { Base_URL } from "../index.js";

// Router
const router = express.Router();

// Creating URL
router.route("/url").post(async (request, response) => {
  const { url, email, customUrl } = request.body;
  // console.log(url);
  const date = new Date();
  const createdAt = `${date.toLocaleDateString()},${date.toLocaleTimeString()}`;
  const lastUpdated = createdAt;

  const shortCheck = await findUrl({ shortUrl: url });
  if (shortCheck) {
    const { shortUrl } = await shortCheck;
    return response.send({ shortUrl, Msg: "Already URL Shortened" });
  }

  const check = await findUrl({ longUrl: url });
  if (!check) {
    if (customUrl) {
      const check = await findUrl({ shortString: customUrl });
      if (check) {
        return response.status(400).send({ Msg: "Try Another Custom URL" });
      }
    }
    const randomString = customUrl ? customUrl : urlGenereator();
    // console.log(url);
    const create = await createData({
      email: email,
      longUrl: url,
      shortString: randomString,
      shortUrl: Base_URL + randomString,
      lastUpdated,
      usedCount: 0,
    });

    const getUrl = await findUrl({ longUrl: url });
    const { shortUrl } = getUrl;
    return response.send({ shortUrl, url, Msg: "URL Created" });
  } else {
    const getUrl = await findUrl({ longUrl: url });
    const { shortUrl } = getUrl;
    return response.send({ shortUrl, Msg: "Already URL Exists" });
  }
});

// Redirect
router.route("/:url").get(async (request, response) => {
  const { url } = request.params;
  const getUrl = await findUrl({ shortString: url });

  // const { longUrl, usedCount } = getUrl;
  const update = await updateLog({
    longUrl: getUrl.longUrl,
    usedCount: getUrl.usedCount + 1,
  });
  if (!getUrl) {
    return response.status(404).send("Not Found");
  }

  return response.redirect(getUrl.longUrl);
});

// Delete
router.route("/deleteurl/:id").delete(async (request, response) => {
  const { id } = request.params;
  const delUrl = await deleteUrl(id);
  const { deletedCount } = delUrl;
  if (deletedCount) {
    return response.send({ Msg: "URL Deleted" });
  }
  return response.status(502).send({ Msg: "Error Occurred" });
});

// GetURL by id
router.route("/geturl/:id").get(async (request, response) => {
  const { id } = request.params;
  const check = await findUrl({ _id: ObjectId(id) });
  if (!check) {
    return response.status(404).send({ Msg: "URL Not Found" });
  }
  return response.send(check);
});

// Edit URL
router.route("/editurl").put(async (request, response) => {
  const { _id, customUrl } = request.body;

  if (customUrl === "") {
    return response.status(400).send({ Msg: "URL Field Should not be empty " });
  }

  const check = await findManyUrl({ shortString: customUrl });
  if (check.length) {
    return response.status(400).send({ Msg: "Custom URL Already Exists" });
  }

  const date = new Date();
  const updateTime = `${date.toLocaleDateString()},${date.toLocaleTimeString()}`;

  const update = await updateUrl({
    _id: ObjectId(_id),
    shortString: customUrl,
    shortUrl: Base_URL + customUrl,
    lastUpdated: updateTime,
  });
  const { modifiedCount } = await update;

  if (!modifiedCount) {
    return response.status(400).send({ Msg: "Error Occurred" });
  }

  return response.send({ Msg: "URL Updated" });
});

export const urlRouter = router;
