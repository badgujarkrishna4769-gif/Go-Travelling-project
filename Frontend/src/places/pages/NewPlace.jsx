import React, { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../shared/components/FormElements/Button";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import Input from "../../shared/components/FormElements/Input";
import {
  VALIDATOR_MINLENGTH,
  VALIDATOR_REQUIRE,
} from "../../shared/util/validators";
import { useForm } from "../../shared/hooks/form-hook";
import { useHttpClient } from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import "./PlaceForm.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CATEGORIES_MAP = {
  "Accommodation":        ["hotel", "resort", "guesthouse", "homestay"],
  "Food & Dining":        ["restaurant", "cafe", "street_food"],
  "Tourist Attractions":  ["tourist_spot", "landmark", "monument", "heritage_site", "viewpoint"],
  "Nature & Outdoor":     ["beach", "park", "garden", "lake", "hill", "waterfall"],
  "Shopping & Leisure":   ["mall", "market", "amusement_park"],
  "Cultural & Religious": ["temple", "mosque", "church", "museum"],
};

const NewPlace = () => {
  const auth     = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const navigate = useNavigate();

  const [selectedCategory,    setSelectedCategory]    = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [categoryError,       setCategoryError]       = useState(false);
  const [subcategoryError,    setSubcategoryError]    = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls,   setPreviewUrls]   = useState([]);
  const [imageError,    setImageError]    = useState("");
  const fileInputRef = useRef(null);

  const [formState, inputHandler] = useForm(
    {
      title:       { value: "", isValid: false },
      description: { value: "", isValid: false },
      address:     { value: "", isValid: false },
    },
    false
  );

  const imagePickHandler = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const total = selectedFiles.length + files.length;
    if (total > 5) {
      setImageError("You can upload a maximum of 5 images.");
      return;
    }

    setImageError("");
    const newFiles    = [...selectedFiles, ...files];
    const newPreviews = [
      ...previewUrls,
      ...files.map((f) => URL.createObjectURL(f)),
    ];
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
    e.target.value = "";
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev)   => prev.filter((_, i) => i !== index));
  };

  const categoryChangeHandler = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedSubcategory("");
    setCategoryError(false);
  };

  const subcategoryChangeHandler = (e) => {
    setSelectedSubcategory(e.target.value);
    setSubcategoryError(false);
  };

  const placeSubmitHandler = async (event) => {
    event.preventDefault();

    if (!selectedCategory)    { setCategoryError(true);    return; }
    if (!selectedSubcategory) { setSubcategoryError(true); return; }
    if (selectedFiles.length === 0) {
      setImageError("Please add at least one image.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title",       formState.inputs.title.value);
      formData.append("description", formState.inputs.description.value);
      formData.append("address",     formState.inputs.address.value);
      formData.append("creator",     auth.userId);
      formData.append("category",    selectedCategory);
      formData.append("subcategory", selectedSubcategory);

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      await sendRequest(
        `${BACKEND_URL}/api/places`, // ← updated
        "POST",
        formData
      );
      navigate("/");
    } catch (err) {}
  };

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />
      <form className="place-form" onSubmit={placeSubmitHandler}>
        {isLoading && <LoadingSpinner asOverlay />}

        <Input
          id="title"
          element="input"
          type="text"
          label="Title"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a valid title."
          onInput={inputHandler}
        />
        <Input
          id="description"
          element="textarea"
          label="Description"
          validators={[VALIDATOR_MINLENGTH(5)]}
          errorText="Please enter a valid description (at least 5 characters)."
          onInput={inputHandler}
        />
        <Input
          id="address"
          element="input"
          label="Address"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a valid address."
          onInput={inputHandler}
        />

        {/* Category */}
        <div className="place-form__dropdown">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={categoryChangeHandler}
            className={`place-form__select ${categoryError ? "place-form__select--error" : ""}`}
          >
            <option value="">-- Select a Category --</option>
            {Object.keys(CATEGORIES_MAP).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {categoryError && <p className="place-form__error">Please select a category.</p>}
        </div>

        {/* Subcategory */}
        {selectedCategory && (
          <div className="place-form__dropdown">
            <label htmlFor="subcategory">Subcategory</label>
            <select
              id="subcategory"
              value={selectedSubcategory}
              onChange={subcategoryChangeHandler}
              className={`place-form__select ${subcategoryError ? "place-form__select--error" : ""}`}
            >
              <option value="">-- Select a Subcategory --</option>
              {CATEGORIES_MAP[selectedCategory].map((sub) => (
                <option key={sub} value={sub}>
                  {sub.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {subcategoryError && <p className="place-form__error">Please select a subcategory.</p>}
          </div>
        )}

        {/* Multi-image upload */}
        <div className="place-form__images">
          <label className="place-form__images-label">
            Images
            <span className="place-form__images-hint">
              Up to 5 images. First image will be the cover.
            </span>
          </label>

          {previewUrls.length > 0 && (
            <div className="place-form__preview-grid">
              {previewUrls.map((url, index) => (
                <div key={index} className="place-form__preview-item">
                  <img src={url} alt={`Preview ${index + 1}`} />
                  {index === 0 && (
                    <span className="place-form__preview-cover">Cover</span>
                  )}
                  <button
                    type="button"
                    className="place-form__preview-remove"
                    onClick={() => removeImage(index)}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {selectedFiles.length < 5 && (
                <button
                  type="button"
                  className="place-form__preview-add"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>➕</span>
                  <span>Add more</span>
                </button>
              )}
            </div>
          )}

          {previewUrls.length === 0 && (
            <div
              className="place-form__upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="place-form__upload-icon">📷</span>
              <p className="place-form__upload-text">Click to upload images</p>
              <p className="place-form__upload-hint">
                PNG, JPG up to 5MB each · Max 5 images
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            multiple
            onChange={imagePickHandler}
            style={{ display: "none" }}
          />

          {imageError && <p className="place-form__error">{imageError}</p>}
        </div>

        <Button
          type="submit"
          disabled={!formState.isValid || selectedFiles.length === 0}
        >
          ADD PLACE
        </Button>
      </form>
    </>
  );
};

export default NewPlace;