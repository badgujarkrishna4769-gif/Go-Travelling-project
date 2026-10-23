import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import MainHead from "./MainHeader";
import NavLinks from "./NavLinks";
import SideDrawer from "./SideDrawer";
import Backdrop from "../UIElements/Backdrop";
import { AuthContext } from "../../context/auth-context";

import "./MainNavigation.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const UserSearch = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = async (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);

    clearTimeout(timerRef.current);

    if (!val || val.trim().length < 2) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/users/search?name=${encodeURIComponent(val)}`, // ← updated
        );
        const data = await res.json();
        setResults(data.users || []);
      } catch (err) {
        setResults([]);
      }
      setIsLoading(false);
    }, 300);
  };

  const handleSelect = (userId) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(`/${userId}/places`);
  };

  const showDropdown = open && query.length >= 2;

  return (
    <div className="user-search" ref={wrapperRef}>
      <div
        className={`user-search__bar ${!auth.isLoggedIn ? "user-search__bar--disabled" : ""}`}
      >
        <span className="user-search__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
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
          className="user-search__input"
          placeholder={auth.isLoggedIn ? "Search users..." : "Login to search"}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          disabled={!auth.isLoggedIn}
        />

        {query && auth.isLoggedIn && (
          <button
            className="user-search__clear"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
          >
            &times;
          </button>
        )}
      </div>

      {showDropdown && (
        <ul className="user-search__dropdown">
          {isLoading && <li className="user-search__status">Searching...</li>}
          {!isLoading && results.length === 0 && (
            <li className="user-search__status">
              No users found for "{query}"
            </li>
          )}
          {!isLoading &&
            results.map((user) => (
              <li
                key={user.id}
                className="user-search__item"
                onClick={() => handleSelect(user.id)}
              >
                <img
                  src={user.image} // ← updated
                  alt={user.name}
                  className="user-search__avatar"
                />
                <span className="user-search__name">{user.name}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

const MainNavigation = () => {
  const [drawerIsOpen, setDrawerIsOpen] = useState(false);
  const location = useLocation();

  const openDrawerHandler = () => setDrawerIsOpen(true);
  const closeDrawerHandler = () => setDrawerIsOpen(false);

  const showUserSearch = location.pathname === "/users";

  return (
    <>
      {drawerIsOpen && <Backdrop onClick={closeDrawerHandler} />}

      <SideDrawer show={drawerIsOpen} onClick={closeDrawerHandler}>
        <nav className="main-navigation__drawer-nav">
          <NavLinks />
        </nav>
      </SideDrawer>

      <MainHead>
        <button
          className="main-navigation__menu-btn"
          onClick={openDrawerHandler}
        >
          <span />
          <span />
          <span />
        </button>
        <h1 className="main-navigation__title">
          <Link to="/">
            <div className="logo-cont">
              <img src="./src/shared/images/GoTravelling_logoV2.png" alt="" />
              GoTravelling
            </div>
          </Link>
        </h1>

        {showUserSearch && <UserSearch />}

        <nav className="main-navigation__header-nav">
          <NavLinks />
        </nav>
      </MainHead>
    </>
  );
};

export default MainNavigation;
