import { keyframes } from "glamor";
import glamorous from "glamorous";
import * as React from "react";

const spin = keyframes("spin", {
  "100%": { transform: "rotate(360deg)" },
});

export default function Loading({ size = "50px", ...props }) {
  return (
    <glamorous.Div
      animation={`${spin} 1s infinite linear`}
      borderRadius="50%"
      borderTop={`solid #000 1px`}
      height={size}
      width={size}
      {...props}
    />
  );
}
