import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

import PlaceItem from "./PlaceItem";
import "./PlaceList.css";
import Button from '../../shared/components/FormElements/Button';

const PlaceList = (props) => {
  const location = useLocation();

  // Scroll to the specific place if a hash is present in the URL
  useEffect(() => {
    if (location.hash && props.items.length > 0) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          // Highlight the card briefly so the user notices it
          el.classList.add("pi-card--highlighted");
          setTimeout(() => el.classList.remove("pi-card--highlighted"), 2000);
        }, 100); // small delay to let the DOM render fully
      }
    }
  }, [location.hash, props.items]);

  if (props.items.length === 0) {
    return (
      <div className="pl-empty">
        <div className="pl-empty__icon">🗺️</div>
        <h2 className="pl-empty__title">No places yet</h2>
        <p className="pl-empty__sub">
          You haven't added any places yet. Start sharing your favourite spots!
        </p>
        <Button to="/places/new">➕ Add Your First Place</Button>
      </div>
    );
  }

  return (
    <div className="pl-wrapper">
      <div className="pl-header">
        <div className="pl-header__left">
          <h2 className="pl-header__title">My Places</h2>
          <span className="pl-header__count">
            {props.items.length} place{props.items.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button to="/places/new">➕ Add Place</Button>
      </div>

      <ul className="pl-grid">
        {props.items.map((place) => (
          <PlaceItem
            key={place.id}
            id={place.id}
            image={place.image}
            images={place.images}
            title={place.title}
            description={place.description}
            address={place.address}
            creatorId={place.creator}
            coordinates={place.location}
            onDelete={props.onDeletePlace}
            likes={place.likes}
            dislikes={place.dislikes}
            comments={place.comments}
            category={place.category}
            subcategory={place.subcategory}
          />
        ))}
      </ul>
    </div>
  );
};

export default PlaceList;