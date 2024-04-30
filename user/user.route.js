import bcrypt from "bcrypt";
import express from "express";
import User from "./user.model.js";
import {
  loginUserValidationSchema,
  registerUserValidationSchema,
} from "./user.validation.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// register
router.post(
  "/user/register",
  async (req, res, next) => {
    // extract new user from req.body
    const newUser = req.body;

    // validate new user

    try {
      const validatedData = await registerUserValidationSchema.validate(
        newUser
      );

      req.body = validatedData;

      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  async (req, res) => {
    // extract new user from req.body
    const newUser = req.body;

    // find user with email
    const user = await User.findOne({ email: newUser.email });

    // if user, throw error
    if (user) {
      return res.status(409).send({ message: "Email already exists." });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(newUser.password, 10);

    // create user
    newUser.password = hashedPassword;

    await User.create(newUser);

    // send response
    return res
      .status(201)
      .send({ message: "User is registered successfully." });
  }
);

// login
router.post(
  "/user/login",
  async (req, res, next) => {
    // extract login credentials from req.body
    const loginCredentials = req.body;

    // validate
    try {
      const validatedData = await loginUserValidationSchema.validate(
        loginCredentials
      );

      req.body = validatedData;

      next();
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  },
  async (req, res) => {
    // extract login credentials from req.body
    const loginCredentials = req.body;

    // find user with email
    const user = await User.findOne({ email: loginCredentials.email });

    // if not user, throw error
    if (!user) {
      return res.status(404).send({ message: "Invalid credentials." });
    }

    // check for password match
    const isPasswordMatch = await bcrypt.compare(
      loginCredentials.password,
      user.password
    );

    // if not password match, throw error
    if (!isPasswordMatch) {
      return res.status(404).send({ message: "Invalid credentials." });
    }

    // generate token
    let payload = { userId: user._id };

    const token = jwt.sign(
      payload,
      "82cda72d3ab0b655d3fbe871fa4fcf8d21649364de17d66a622bd565a192d6628c3b3122bfa39227c83fcca4c8adc913b7b723eaa62b3931a27c37d091254b17",
      {
        expiresIn: "1d",
      }
    );

    // send res
    return res
      .status(200)
      .send({ message: "success", token: token, user: user });
  }
);

export default router;
