import { validationResult } from "express-validator";

import HttpError from "../models/http-error.js";
import User from "../models/user.js";

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, { password: 0 });
  } catch (err) {
    return next(
      new HttpError("Fetching users failed, please try again later.", 500)
    );
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const getUsersByName = async (req, res, next) => {
  const query = req.query.name?.trim();

  if (!query || query.length < 2) {
    return res.json({ users: [] });
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let users;
  try {
    users = await User.find(
      { name: { $regex: escaped, $options: "i" } },
      { password: 0 }
    ).limit(10);
  } catch (err) {
    return next(
      new HttpError("Searching users failed, please try again later.", 500)
    );
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs, please check the entered data.", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("Signing up failed, please try again later.", 500)
    );
  }

  if (existingUser) {
    return next(
      new HttpError("User exists already, please login instead.", 422)
    );
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(new HttpError("Signing up failed, please try again.", 500));
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Login failed, please try again later.", 500));
  }

  if (!existingUser || existingUser.password !== password) {
    return next(
      new HttpError("Could not identify the user. Wrong credentials.", 401)
    );
  }

  res.json({
    message: "Logged in!",
    user: existingUser.toObject({ getters: true }),
  });
};

export { getUsers, getUsersByName, signup, login };