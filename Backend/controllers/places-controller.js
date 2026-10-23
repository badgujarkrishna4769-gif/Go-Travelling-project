import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import HttpError from "../models/http-error.js";
import getCoordsForAddress from "../util/location.js";
import Place from "../models/place.js";
import User from "../models/user.js";

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    return next(
      new HttpError("Fetching places failed, please try again later", 500)
    );
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find place(s) with the provided user id.", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not find place.", 500)
    );
  }

  if (!place) {
    return next(
      new HttpError("Could not find place with the provided place id.", 404)
    );
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs, please check the entered data.", 422));
  }

  const { title, description, address, creator, category, subcategory } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const imageFiles = req.files || [];
  if (imageFiles.length === 0) {
    return next(new HttpError("At least one image is required.", 422));
  }

  // Cloudinary returns secure_url and path — use secure_url for display
  const imageUrls    = imageFiles.map((f) => f.path);        // ← Cloudinary URL
  const imagePublicIds = imageFiles.map((f) => f.filename);  // ← for deletion later

  const newPlace = new Place({
    title,
    description,
    address,
    location:        coordinates,
    images:          imageUrls,          // ← Cloudinary URLs
    image:           imageUrls[0] || "", // ← first image as fallback
    imagePublicIds:  imagePublicIds,     // ← store public IDs for deletion
    creator,
    category,
    subcategory,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    return next(new HttpError("Creating place failed, please try again.", 500));
  }

  if (!user) {
    return next(new HttpError("Could not find user for the provided id", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newPlace.save({ session: sess });
    user.places.push(newPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("Creating place failed, please try again.", 500));
  }

  res.status(201).json({ place: newPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs, please check the entered data.", 422)
    );
  }

  const { title, description, category, subcategory } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update place.", 500)
    );
  }

  place.title       = title;
  place.description = description;
  place.category    = category;
  place.subcategory = subcategory;

  try {
    await place.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update place.", 500)
    );
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    return next(new HttpError("Something went wrong, could not delete place.", 500));
  }

  if (!place) {
    return next(new HttpError("Could not find place for this id.", 404));
  }

  // Collect Cloudinary public IDs for deletion
  const publicIds = place.imagePublicIds?.length > 0
    ? place.imagePublicIds
    : [];

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("Something went wrong, could not delete place.", 500));
  }

  // Delete images from Cloudinary
  if (publicIds.length > 0) {
    try {
      await Promise.all(
        publicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
      );
    } catch (err) {
      console.log("Cloudinary deletion error:", err);
      // Don't block the response if image deletion fails
    }
  }

  res.status(200).json({ message: "Deleted place." });
};

// Search by address with optional category and subcategory filter
const getPlacesByAddress = async (req, res, next) => {
  const query       = req.query.address?.trim();
  const category    = req.query.category?.trim();
  const subcategory = req.query.subcategory?.trim();

  if (!query || query.length < 2) {
    return res.json({ places: [] });
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const filter = {
    address: { $regex: escaped, $options: "i" },
  };

  if (category)    filter.category    = category;
  if (subcategory) filter.subcategory = subcategory;

  try {
    const places = await Place.find(filter).limit(15);
    res.json({ places: places.map((p) => p.toObject({ getters: true })) });
  } catch (err) {
    return next(new HttpError("Search failed", 500));
  }
};

// --- LIKE ---
const likePlace = async (req, res, next) => {
  const { pid }    = req.params;
  const { userId } = req.body;

  let place;
  try {
    place = await Place.findById(pid);
  } catch (err) {
    return next(new HttpError("Could not find place", 500));
  }

  if (!place) return next(new HttpError("Place not found", 404));

  place.dislikes = place.dislikes.filter((id) => id.toString() !== userId);

  const alreadyLiked = place.likes.some((id) => id.toString() === userId);
  if (alreadyLiked) {
    place.likes = place.likes.filter((id) => id.toString() !== userId);
  } else {
    place.likes.push(userId);
  }

  try {
    await place.save();
  } catch (err) {
    return next(new HttpError("Liking failed", 500));
  }

  res.json({ likes: place.likes.length, dislikes: place.dislikes.length });
};

// --- DISLIKE ---
const dislikePlace = async (req, res, next) => {
  const { pid }    = req.params;
  const { userId } = req.body;

  let place;
  try {
    place = await Place.findById(pid);
  } catch (err) {
    return next(new HttpError("Could not find place", 500));
  }

  if (!place) return next(new HttpError("Place not found", 404));

  place.likes = place.likes.filter((id) => id.toString() !== userId);

  const alreadyDisliked = place.dislikes.some((id) => id.toString() === userId);
  if (alreadyDisliked) {
    place.dislikes = place.dislikes.filter((id) => id.toString() !== userId);
  } else {
    place.dislikes.push(userId);
  }

  try {
    await place.save();
  } catch (err) {
    return next(new HttpError("Disliking failed", 500));
  }

  res.json({ likes: place.likes.length, dislikes: place.dislikes.length });
};

// --- ADD COMMENT ---
const addComment = async (req, res, next) => {
  const { pid }          = req.params;
  const { text, userId } = req.body;

  if (!text || text.trim().length === 0) {
    return next(new HttpError("Comment cannot be empty", 422));
  }

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    return next(new HttpError("Could not find user", 500));
  }

  if (!user) return next(new HttpError("User not found", 404));

  let place;
  try {
    place = await Place.findById(pid);
  } catch (err) {
    return next(new HttpError("Could not find place", 500));
  }

  if (!place) return next(new HttpError("Place not found", 404));

  const newComment = {
    user: userId,
    name: user.name,
    text: text.trim(),
    date: new Date(),
  };

  place.comments.push(newComment);

  try {
    await place.save();
  } catch (err) {
    return next(new HttpError("Adding comment failed", 500));
  }

  const savedComment = place.comments[place.comments.length - 1];
  res.status(201).json({ comment: savedComment });
};

// --- DELETE COMMENT ---
const deleteComment = async (req, res, next) => {
  const { pid, cid } = req.params;
  const { userId }   = req.body;

  let place;
  try {
    place = await Place.findById(pid);
  } catch (err) {
    return next(new HttpError("Could not find place", 500));
  }

  if (!place) return next(new HttpError("Place not found", 404));

  const comment = place.comments.id(cid);
  if (!comment) return next(new HttpError("Comment not found", 404));

  if (comment.user.toString() !== userId) {
    return next(new HttpError("Not authorized", 401));
  }

  place.comments.pull({ _id: cid });

  try {
    await place.save();
  } catch (err) {
    return next(new HttpError("Deleting comment failed", 500));
  }

  res.json({ message: "Comment deleted" });
};

export {
  likePlace,
  dislikePlace,
  addComment,
  deleteComment,
  getPlacesByAddress,
  deletePlace,
  updatePlace,
  createPlace,
  getPlaceById,
  getPlacesByUserId,
};