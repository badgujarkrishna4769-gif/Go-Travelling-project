import React, { useContext } from "react";
import { NavLink } from "react-router-dom";

import { AuthContext } from "../../context/auth-context";
import "./NavLinks.css";


const NavLinkS = () => {
  const auth = useContext(AuthContext);
  return (
    <ul className="nav-links">
      <li>
        <NavLink to="/" exact>
          HOME
        </NavLink>
      </li>
      {auth.isLoggedIn && <li>
        <NavLink to="/users" exact>
          USERS
        </NavLink>
      </li>}
      {auth.isLoggedIn && <li>
        <NavLink to={`/${auth.userId}/places`}>MY PLACES</NavLink>
      </li> }
      {auth.isLoggedIn && <li>
        <NavLink to="/places/new">ADD PLACE</NavLink>
      </li>}
      {!auth.isLoggedIn && <li>
        <NavLink to="/Auth">LOGIN</NavLink>
      </li>}
      {
        auth.isLoggedIn && <li>
          <NavLink to="/Auth" onClick={auth.logout}>LOGOUT</NavLink>
        </li>
      }
    </ul>
  );
};

export default NavLinkS;
