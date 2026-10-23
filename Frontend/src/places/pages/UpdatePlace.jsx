import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Input from "../../shared/components/FormElements/Input";
import Button from "../../shared/components/FormElements/Button";
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH,
} from "../../shared/util/validators";
import { useForm } from "../../shared/hooks/form-hook";
import "./PlaceForm.css";
import Card from "../../shared/components/UIElements/Card";
import { useHttpClient } from "../../shared/hooks/http-hook";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import { AuthContext } from "../../shared/context/auth-context";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CATEGORIES_MAP = {
  "Accommodation":        ["hotel", "resort", "guesthouse", "homestay"],
  "Food & Dining":        ["restaurant", "cafe", "street_food"],
  "Tourist Attractions":  ["tourist_spot", "landmark", "monument", "heritage_site", "viewpoint"],
  "Nature & Outdoor":     ["beach", "park", "garden", "lake", "hill", "waterfall"],
  "Shopping & Leisure":   ["mall", "market", "amusement_park"],
  "Cultural & Religious": ["temple", "mosque", "church", "museum"],
};

const UpdatePlace = () => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [loadedPlace, setLoadedPlace] = useState();
  const placeId = useParams().placeId;
  const navigate = useNavigate();

  const [selectedCategory,    setSelectedCategory]    = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [categoryError,       setCategoryError]       = useState(false);
  const [subcategoryError,    setSubcategoryError]    = useState(false);

  const [formState, inputHandler, setFormData] = useForm(
    {
      title:       { value: "", isValid: false },
      description: { value: "", isValid: false },
    },
    false
  );

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const responseData = await sendRequest(
          `${BACKEND_URL}/api/places/${placeId}` // ← updated
        );
        setLoadedPlace(responseData.place);
        setSelectedCategory(responseData.place.category || "");
        setSelectedSubcategory(responseData.place.subcategory || "");
        setFormData(
          {
            title:       { value: responseData.place.title,       isValid: true },
            description: { value: responseData.place.description, isValid: true },
          },
          true
        );
      } catch (err) {}
    };
    fetchPlace();
  }, [sendRequest, placeId, setFormData]);

  const categoryChangeHandler = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedSubcategory("");
    setCategoryError(false);
  };

  const subcategoryChangeHandler = (e) => {
    setSelectedSubcategory(e.target.value);
    setSubcategoryError(false);
  };

  const placeUpdateSubmitHandler = async (event) => {
    event.preventDefault();

    if (!selectedCategory)    { setCategoryError(true);    return; }
    if (!selectedSubcategory) { setSubcategoryError(true); return; }

    try {
      await sendRequest(
        `${BACKEND_URL}/api/places/${placeId}`, // ← updated
        "PATCH",
        JSON.stringify({
          title:       formState.inputs.title.value,
          description: formState.inputs.description.value,
          category:    selectedCategory,
          subcategory: selectedSubcategory,
        }),
        { "Content-Type": "application/json" }
      );
      navigate("/" + auth.userId + "/places");
    } catch (err) {}
  };

  if (isLoading) {
    return (
      <div className="center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!loadedPlace && !error) {
    return (
      <div className="center">
        <Card>
          <h2>Could not find place!</h2>
        </Card>
      </div>
    );
  }

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />
      {!isLoading && loadedPlace && (
        <form className="place-form" onSubmit={placeUpdateSubmitHandler}>
          <Input
            id="title"
            element="input"
            type="text"
            label="Title"
            validators={[VALIDATOR_REQUIRE()]}
            errorText="Please enter a valid title."
            onInput={inputHandler}
            initialValue={loadedPlace.title}
            initialValid={true}
          />
          <Input
            id="description"
            element="textarea"
            label="Description"
            validators={[VALIDATOR_MINLENGTH(5)]}
            errorText="Please enter a valid description (at least five characters)."
            onInput={inputHandler}
            initialValue={loadedPlace.description}
            initialValid={true}
          />

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
            {categoryError && (
              <p className="place-form__error">Please select a category.</p>
            )}
          </div>

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
              {subcategoryError && (
                <p className="place-form__error">Please select a subcategory.</p>
              )}
            </div>
          )}

          <Button type="submit" disabled={!formState.isValid}>
            UPDATE PLACE
          </Button>
        </form>
      )}
    </>
  );
};

export default UpdatePlace;