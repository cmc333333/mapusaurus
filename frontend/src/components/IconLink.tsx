import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import glamorous from "glamorous";
import * as React from "react";

export default function Expander({ icon, onClick, title, ...css }) {
  const wrappedOnClick = ev => {
    ev.preventDefault();
    onClick();
  };
  return (
    <glamorous.A
      href="#"
      onClick={wrappedOnClick}
      title={title}
      {...css}
    >
      <FontAwesomeIcon icon={icon} />
    </glamorous.A>
  );
}
