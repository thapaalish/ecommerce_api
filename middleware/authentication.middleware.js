import jwt from "jsonwebtoken";
import User from "../user/user.model.js";

export const isSeller = async (req, res, next) => {
  // extract token from req.headers
  const authorization = req.headers.authorization;
  const splittedValues = authorization?.split(" ");

  const token = splittedValues?.length == 2 ? splittedValues[1] : undefined;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  let payload;
  try {
    payload = jwt.verify(
      token,
      "82cda72d3ab0b655d3fbe871fa4fcf8d21649364de17d66a622bd565a192d6628c3b3122bfa39227c83fcca4c8adc913b7b723eaa62b3931a27c37d091254b17"
    );
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  //   find user using userId from payload
  const user = await User.findOne({ _id: payload.userId });

  // if not user, throw error
  if (!user) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  // user role must be seller
  if (user.role !== "seller") {
    return res.status(401).send({ message: "Unauthorized." });
  }

  req.loggedInUserId = user._id;

  // call next function
  next();
};

// no role check
export const isUser = async (req, res, next) => {
  // extract token from req.headers
  const authorization = req.headers.authorization;
  const splittedValues = authorization?.split(" ");

  const token = splittedValues?.length == 2 ? splittedValues[1] : undefined;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  let payload;
  try {
    payload = jwt.verify(
      token,
      "82cda72d3ab0b655d3fbe871fa4fcf8d21649364de17d66a622bd565a192d6628c3b3122bfa39227c83fcca4c8adc913b7b723eaa62b3931a27c37d091254b17"
    );
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  //   find user using userId from payload
  const user = await User.findOne({ _id: payload.userId });

  // if not user, throw error
  if (!user) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  req.loggedInUserId = user._id;

  // call next function
  next();
};

export const isBuyer = async (req, res, next) => {
  // extract token from req.headers
  const authorization = req.headers.authorization;
  const splittedValues = authorization?.split(" ");

  const token = splittedValues?.length == 2 ? splittedValues[1] : undefined;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  let payload;
  try {
    payload = jwt.verify(
      token,
      "82cda72d3ab0b655d3fbe871fa4fcf8d21649364de17d66a622bd565a192d6628c3b3122bfa39227c83fcca4c8adc913b7b723eaa62b3931a27c37d091254b17"
    );
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  //   find user using userId from payload
  const user = await User.findOne({ _id: payload.userId });

  // if not user, throw error
  if (!user) {
    return res.status(401).send({ message: "Unauthorized." });
  }

  // user role must be seller
  if (user.role !== "buyer") {
    return res.status(401).send({ message: "Unauthorized." });
  }

  req.loggedInUserId = user._id;

  // call next function
  next();
};
