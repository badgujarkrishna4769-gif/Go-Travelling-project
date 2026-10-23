import mongoose from "mongoose";

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

const placeSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  address:     { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  images: { type: [String], default: [] },
  image:  { type: String, default: "" },
  creator:  { type: mongoose.Types.ObjectId, required: true, ref: "User" },

  // Category & Subcategory
  category:    {
    type: String,
    enum: CATEGORIES,
    required: true,
  },
  subcategory: {
    type: String,
    enum: SUBCATEGORIES,
    required: true,
  },

  // Likes / Dislikes / Comments
  likes:    { type: [{ type: mongoose.Types.ObjectId, ref: "User" }], default: [] },
  dislikes: { type: [{ type: mongoose.Types.ObjectId, ref: "User" }], default: [] },
  comments: {
    type: [
      {
        user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        text: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
});

export default mongoose.model("Place", placeSchema);