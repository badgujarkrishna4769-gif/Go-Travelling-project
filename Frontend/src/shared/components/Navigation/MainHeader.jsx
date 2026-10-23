import React from "react";

import "./MainHeader.css";

const MainHead = (props) => {
  return <header className="main-header">{props.children}</header>;
};

export default MainHead;
