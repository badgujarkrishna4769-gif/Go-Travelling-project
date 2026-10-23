
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import { AuthContext } from "../shared/context/auth-context";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CATEGORIES_MAP = {
  Accommodation: ["hotel", "resort", "guesthouse", "homestay"],
  "Food & Dining": ["restaurant", "cafe", "street_food"],
  "Tourist Attractions": [
    "tourist_spot",
    "landmark",
    "monument",
    "heritage_site",
    "viewpoint",
  ],
  "Nature & Outdoor": ["beach", "park", "garden", "lake", "hill", "waterfall"],
  "Shopping & Leisure": ["mall", "market", "amusement_park"],
  "Cultural & Religious": ["temple", "mosque", "church", "museum"],
};

/* ─── Logged-out home page ─── */
const GuestHome = () => (
  <div className="guest-home">
    <section className="guest-hero">
      <div className="guest-hero__bg">
        <span className="guest-hero__circle guest-hero__circle--1" />
        <span className="guest-hero__circle guest-hero__circle--2" />
        <span className="guest-hero__circle guest-hero__circle--3" />
      </div>
      <div className="guest-hero__content">
        <div className="guest-hero__badge">✈️ Welcome to GoTravelling</div>
        <h1 className="guest-hero__title">
          Discover the World,
          <br />
          <span className="guest-hero__title--accent">One Place at a Time</span>
        </h1>
        <p className="guest-hero__subtitle">
          Connect with travellers worldwide, share your favourite spots, and
          explore thousands of places added by people just like you.
        </p>
        <Link to="/auth">
          <button className="guest-hero__btn">
            Start Your Journey
            <span className="guest-hero__btn-arrow">→</span>
          </button>
        </Link>
      </div>
    </section>

    <section className="guest-features">
      <div className="guest-features__card guest-features__card--1">
        <div className="guest-features__icon">🌍</div>
        <h3>Connect Globally</h3>
        <p>
          Meet travellers from every corner of the world and discover hidden
          gems through their eyes.
        </p>
      </div>
      <div className="guest-features__card guest-features__card--2">
        <div className="guest-features__icon">📸</div>
        <h3>Share Experiences</h3>
        <p>
          Upload photos, write descriptions, and pin your favourite places on
          the map for others to find.
        </p>
      </div>
      <div className="guest-features__card guest-features__card--3">
        <div className="guest-features__icon">🔍</div>
        <h3>Search & Explore</h3>
        <p>
          Find beaches, temples, restaurants, and more — filtered by category,
          city, or country.
        </p>
      </div>
      <div className="guest-features__card guest-features__card--4">
        <div className="guest-features__icon">❤️</div>
        <h3>Like & Comment</h3>
        <p>
          React to places you love and leave comments to help fellow travellers
          plan their trips.
        </p>
      </div>
    </section>

    <section className="guest-stats">
      <div className="guest-stats__item">
        <span className="guest-stats__number">🗺️</span>
        <span className="guest-stats__label">Explore Places</span>
      </div>
      <div className="guest-stats__item">
        <span className="guest-stats__number">👥</span>
        <span className="guest-stats__label">Meet Travellers</span>
      </div>
      <div className="guest-stats__item">
        <span className="guest-stats__number">📍</span>
        <span className="guest-stats__label">Pin Locations</span>
      </div>
      <div className="guest-stats__item">
        <span className="guest-stats__number">💬</span>
        <span className="guest-stats__label">Share Stories</span>
      </div>
    </section>

    <section className="guest-cta">
      <h2>Ready to start exploring?</h2>
      <p>Join GoTravelling today — it's free and takes less than a minute.</p>
      <Link to="/auth">
        <button className="guest-cta__btn">Get Started Now →</button>
      </Link>
    </section>
  </div>
);

/* ─── Logged-in home page ─── */
const UserHome = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [address, setAddress]         = useState("");
  const [category, setCategory]       = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [results, setResults]         = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);

  const categoryChangeHandler = (e) => {
    setCategory(e.target.value);
    setSubcategory("");
  };

  const searchHandler = async () => {
    if (!address.trim() || address.trim().length < 2) return;
    setIsLoading(true);
    setHasSearched(true);

    // ← updated: uses BACKEND_URL
    let url = `${BACKEND_URL}/api/places/search?address=${encodeURIComponent(address)}`;
    if (category)    url += `&category=${encodeURIComponent(category)}`;
    if (subcategory) url += `&subcategory=${encodeURIComponent(subcategory)}`;

    try {
      const res  = await fetch(url);
      const data = await res.json();
      setResults(data.places || []);
    } catch (err) {
      setResults([]);
    }
    setIsLoading(false);
  };

  return (
    <div className="user-home">
      <section className="user-home__welcome">
        <div className="user-home__welcome-content">
          <h1>Where to next? 🌿</h1>
          <p>
            Search for places by city or address and filter by category to find
            exactly what you're looking for.
          </p>
        </div>
      </section>

      <section className="user-home__search">
        <div className="user-home__search-card">
          <h2 className="user-home__search-title">
            <span>🔍</span> Search Places
          </h2>
          <p className="user-home__search-sub">
            Type a city, address, or landmark and filter by category.
          </p>

          <div className="user-home__search-bar">
            <span className="user-home__search-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="e.g. New York, Paris, Tokyo..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchHandler()}
              className="user-home__search-input"
            />
            {address && (
              <button
                className="user-home__search-clear"
                onClick={() => {
                  setAddress("");
                  setResults([]);
                  setHasSearched(false);
                }}
              >
                &times;
              </button>
            )}
          </div>

          <div className="user-home__filters">
            <select
              value={category}
              onChange={categoryChangeHandler}
              className="user-home__select"
            >
              <option value="">All Categories</option>
              {Object.keys(CATEGORIES_MAP).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {category && (
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="user-home__select"
              >
                <option value="">All Subcategories</option>
                {CATEGORIES_MAP[category].map((sub) => (
                  <option key={sub} value={sub}>
                    {sub.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            )}

            <button
              className="user-home__search-btn"
              onClick={searchHandler}
              disabled={address.trim().length < 2}
            >
              Search
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="user-home__status">
            <div className="user-home__spinner" />
            Searching...
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <p className="user-home__status">
            No places found. Try a different address or category.
          </p>
        )}

        {!isLoading && results.length > 0 && (
          <>
            <p className="user-home__results-count">
              {results.length} place{results.length !== 1 ? "s" : ""} found
            </p>
            <ul className="user-home__results">
              {results.map((place) => (
                <li key={place.id} className="user-home__result-card">
                  <img
                    src={place.image}
                    alt={place.title}
                    className="user-home__result-img"
                  />
                  <div className="user-home__result-info">
                    <h3>{place.title}</h3>
                    <p className="user-home__result-address">
                      📍 {place.address}
                    </p>
                    <div className="user-home__result-tags">
                      {place.category && (
                        <span className="user-home__tag user-home__tag--cat">
                          {place.category}
                        </span>
                      )}
                      {place.subcategory && (
                        <span className="user-home__tag user-home__tag--sub">
                          {place.subcategory.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <p className="user-home__result-desc">
                      {place.description}
                    </p>
                    <button
                      className="user-home__result-btn"
                      onClick={() =>
                        navigate(`/${place.creator}/places#place-${place.id}`)
                      }
                    >
                      View Place →
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="user-home__quick">
        <Link to="/users" className="user-home__quick-card">
          <span>👥</span>
          <p>Browse All Users</p>
        </Link>
        <Link to="/places/new" className="user-home__quick-card">
          <span>➕</span>
          <p>Add a New Place</p>
        </Link>
        <Link to={`/${auth.userId}/places`} className="user-home__quick-card">
          <span>📍</span>
          <p>My Places</p>
        </Link>
      </section>
    </div>
  );
};

/* ─── Root component ─── */
const HomePage = () => {
  const auth = useContext(AuthContext);
  return auth.isLoggedIn ? <UserHome /> : <GuestHome />;
};

export default HomePage;