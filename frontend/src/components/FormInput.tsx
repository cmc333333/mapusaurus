import { css } from "glamor";
import glamorous from "glamorous";
import * as React from "react";

import {
  border,
  mediumSpace,
  smallSpace,
  textBg,
  xLargeSpace,
  xSmallHeading,
} from "../theme";

export const inputStyle = css({
  border,
  backgroundColor: textBg,
  height: xLargeSpace,
  paddingBottom: smallSpace,
  paddingLeft: mediumSpace,
  paddingRight: mediumSpace,
  paddingTop: smallSpace,
});

export default function FormInput({ children, fullWidth = false, name }) {
  return (
    <glamorous.Label
      display="block"
      height={fullWidth ? "inherit" : xLargeSpace}
      marginBottom={mediumSpace}
      textAlign={fullWidth ? "left" : "right"}
    >
      <glamorous.Span
        {...xSmallHeading}
        display={fullWidth ? "block" : "inline"}
        float={fullWidth ? "none" : "left"}
        lineHeight={xLargeSpace}
      >
        {name}
      </glamorous.Span>
      {children}
    </glamorous.Label>
  );
}
