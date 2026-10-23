import axios from "axios";
import HttpError from "../models/http-error.js";
import dotenv from "dotenv";

dotenv.config(); 

async function getCoordsForAddress(address) {
  let response;

  try {
    response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${process.env.LOCATION_API_KEY}`
    );
  } catch (err) {
    throw new HttpError(
      "Could not connect to location service.",
      500
    );
  }

  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError(
      "Could not find location for the given address.",
      422
    );
  }

  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

export default getCoordsForAddress;
