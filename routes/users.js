import {
  Getuser,
  Createuser,
  genpassword,
  updateUser,
  activateuser,
  updatePass,
} from "../helperfunction.js";
import { client } from "../index.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { auth } from "../middleware/auth.js";
import bcrypt from "bcrypt";
import express from "express";
const router = express.Router();

router.route("/").get((req, res) => {
  res.send({ message: "Server is up and start running" });
});

router.route("/signup").post(async (req, res) => {
  const { Firstname, Lastname, Username, email, Password, Status } = req.body;

  const userdata = await Getuser(
    Username ? { Username: Username } : { email: email }
  );
  if (userdata) {
    return res.status(401).send({ message: "credentials already exists" });
  }

  const hashedPassword = await genpassword(Password);
  const user = await Createuser({
    Firstname,
    Lastname,
    Username,
    email,
    Password: hashedPassword,
    Status,
  });

  const userfromDB = await Getuser({ Username: Username });
  const token = jwt.sign({ id: userfromDB._id }, process.env.secret_key);
  // console.log(token);
  const user1 = await updateUser({
    Username: userfromDB.Username,
    token: token,
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: `${process.env.my_gmail}`,
      pass: `${process.env.my_pass}`,
    },
  });

  const link = `https://url-shor-tener.netlify.app/activation/${token}`;
  const mailoptions = {
    from: "userbase@gmail.com",
    to: email,
    subject: "Link to activate the account",
    html: `<h1>Hello ${userfromDB.Firstname}</h1>
    <p>Greetings from URL-SHORTENER Team and warm welcome</p>
    <p>Please click on the following link or paste this in your browser to complete the process of activate the account</p>
          <a href=${link} target=_>Click to activate the account</a>
          <p>It is mandatory to activate the account</p>
          `,
  };

  transporter.sendMail(mailoptions, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Email sent: " + res.response);
    }
  });
  res.send({ message: "activation mail sent" });
});

router.route("/twostepverification").get(async (req, res) => {
  const token = req.header(`x-auth-token`);
  // console.log(token);
  const tokenVerify = jwt.verify(token, process.env.secret_key);
  if (!tokenVerify) {
    return res.status(400).send({ message: "Verification Link expires" });
  }
  const updateuser = await activateuser({ token: token });
  return res.status(200).send(updateuser);
});

router.route("/login").post(async (req, res) => {
  const { email, password } = req.body;
  const userfromDB = await Getuser({ email: email });
  if (!userfromDB) {
    res.status(401).send({ message: "Invalid Credentials" });
    return;
  }
  if (userfromDB.Status == "Inactive") {
    res.status(403).send({ message: "Account is not activated" });
    return;
  }
  const storedPassword = userfromDB.Password;
  const ispasswordmatch = await bcrypt.compare(password, storedPassword);
  if (ispasswordmatch) {
    res.status(200).send(userfromDB);
  } else {
    res.status(401).send({ message: "Invalid Credentials" });
  }
});

router.route("/forgotpassword").post(async (req, res) => {
  const { email } = req.body;

  const userfromDB = await Getuser({ email: email });
  // console.log(userfromDB);
  if (!userfromDB) {
    // console.error("Mail not registered");
    res.status(403).send({ Msg: "Mail is not registered" });
    return;
  }
  const token = userfromDB.token;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: `${process.env.my_gmail}`,
      pass: `${process.env.my_pass}`,
    },
  });

  const link = `https://url-shor-tener.netlify.app/forgotpassword/verify/${token}`;
  const mailoptions = {
    from: "userbase@gmail.com",
    to: email,
    subject: "Link to reset password",
    html: `<h1>Hello ${userfromDB.Firstname}</h1>
    <p>You are requested to change password</p>
    <p>Please click on the following link or paste this in your browser to complete the process of reset password</p>
      <a href=${link} target=_blank>Click to reset password</a>
      <p>Automatically it redirected you to resetpassword page</p>`,
  };

  transporter.sendMail(mailoptions, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Email sent: " + res.response);
    }
  });
  res.status(200).send({ Msg: "recovery mail sent" });
});
router.route("/forgotpassword/verify").get(auth, async (req, res) => {
  return res.status(200).send({ Message: "token matched" });
});

router.route("/resetpassword").post(async (req, res) => {
  const { password, token } = req.body;
  // console.log(token);
  const data = await Getuser({ token: token });
  // console.log(data);
  // the data is not there in the DB return an error msg
  if (!data) {
    return res.status(401).send({ Message: "Invalid credentials" });
  }
  const { email } = data;
  // console.log(email);

  const hashedpassword = await genpassword(password);
  const user = await updatePass({
    email: email,
    password: hashedpassword,
  });
  const result = await Getuser({ email });
  res.send(user);
});

router.route("/getdata").get(async (req, res) => {
  const token = req.header("x-auth-token");
  const check = await Getuser({ token: token });
  if (!check) {
    return res.status(404).send("Not Found");
  }
  return res.send(check);
});

router.route("/userdata").get(auth, async (req, res) => {
  const token = req.header("x-auth-token");
  const getdata = await Getuser({ token: token });
  const { email } = await getdata;
  const get = await client
    .db("urlshort")
    .collection("users")
    .aggregate([
      {
        $lookup: {
          from: "urls",
          localField: "email",
          foreignField: "email",
          as: "urls",
        },
      },
      { $match: { email: email } },
    ])
    .toArray();

  const result = await get[0].urls;
  if (!result) {
    res.status(404).send("Not Found");
  }
  // console.log(result);
  res.send(result);
});
export const userRouter = router;
