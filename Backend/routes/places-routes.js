import express from "express";
import { check } from "express-validator";

import * as placesController from "../controllers/places-controller.js";
import fileUpload from "../middleware/file-upload.js";

const router = express.Router();

const CATEGORIES = [
  "Accommodation",
  "Food & Dining",
  "Tourist Attractions",
  "Nature & Outdoor",
  "Shopping & Leisure",
  "Cultural & Religious",
];

const SUBCATEGORIES = [
  // Accommodation
  "hotel", "resort", "guesthouse", "homestay",
  // Food & Dining
  "restaurant", "cafe", "street_food",
  // Tourist Attractions
  "tourist_spot", "landmark", "monument", "heritage_site", "viewpoint",
  // Nature & Outdoor
  "beach", "park", "garden", "lake", "hill", "waterfall",
  // Shopping & Leisure
  "mall", "market", "amusement_park",
  // Cultural & Religious
  "temple", "mosque", "church", "museum",
];

router.get("/user/:uid", placesController.getPlacesByUserId);

// Search route
router.get("/search", placesController.getPlacesByAddress);

// Like / Dislike / Comment routes (must be before /:pid)
router.post("/:pid/like",           placesController.likePlace);
router.post("/:pid/dislike",        placesController.dislikePlace);
router.post("/:pid/comment",        placesController.addComment);
router.delete("/:pid/comment/:cid", placesController.deleteComment);

// /:pid routes below
router.get("/:pid", placesController.getPlaceById);

router.post(
  "/",
  fileUpload.array("images", 5),
  [
    check("title").not().isEmpty().withMessage("Title is required."),
    check("description").isLength({ min: 5 }).withMessage("Description must be at least 5 characters."),
    check("address").not().isEmpty().withMessage("Address is required."),
    check("category")
      .not().isEmpty().withMessage("Category is required.")
      .isIn(CATEGORIES).withMessage("Invalid category."),         // ← new
    check("subcategory")
      .not().isEmpty().withMessage("Subcategory is required.")
      .isIn(SUBCATEGORIES).withMessage("Invalid subcategory."),   // ← new
  ],
  placesController.createPlace
);

router.patch(
  "/:pid",
  [
    check("title").not().isEmpty().withMessage("Title is required."),
    check("description").isLength({ min: 5 }).withMessage("Description must be at least 5 characters."),
    check("category")
      .not().isEmpty().withMessage("Category is required.")
      .isIn(CATEGORIES).withMessage("Invalid category."),         // ← new
    check("subcategory")
      .not().isEmpty().withMessage("Subcategory is required.")
      .isIn(SUBCATEGORIES).withMessage("Invalid subcategory."),   // ← new
  ],
  placesController.updatePlace
);

router.delete("/:pid", placesController.deletePlace);

export default router;