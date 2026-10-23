import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './shared/context/auth-context'; 
import usePlaceSearch from './shared/hooks/usePlaceSearch';
import './PlaceSearch.css';

const PlaceSearch = () => {
  const auth = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { results, isLoading, clearResults } = usePlaceSearch(query);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const showDropdown = open && query.length >= 2;

  return (
    <div className="place-search" ref={wrapperRef}>
      <div className={`place-search__input-wrapper ${!auth.isLoggedIn ? 'place-search--disabled' : ''}`}>
        <span className="place-search__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder={auth.isLoggedIn ? 'Search by city or address...' : 'Login to search places'}
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          className="place-search__input"
          disabled={!auth.isLoggedIn}   // ← disables the input
        />
        {query && auth.isLoggedIn && (
          <button className="place-search__clear" onClick={() => { setQuery(''); clearResults(); }}>
            &times;
          </button>
        )}
      </div>

      {showDropdown && auth.isLoggedIn && (
        <ul className="place-search__dropdown">
          {isLoading && <li className="place-search__status">Searching...</li>}
          {!isLoading && results.length === 0 && (
            <li className="place-search__status">No places found in "{query}"</li>
          )}
          {!isLoading && results.map(place => (
            <li key={place.id} className="place-search__item">
              <Link to={`/${place.creator}/places`} onClick={() => setOpen(false)}>
                <img src={place.image} alt={place.title} className="place-search__thumb" />
                <div className="place-search__info">
                  <span className="place-search__title">{place.title}</span>
                  <span className="place-search__address">{place.address}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlaceSearch;
