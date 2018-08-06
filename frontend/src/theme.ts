import * as Typography from "typography";
import * as bootstrapTheme from "typography-theme-bootstrap";

bootstrapTheme.overrideThemeStyles = ({ rhythm }, options) => ({
  a: {
    color: "inherit",
    textDecoration: "none",
  },
});

export const typography = new Typography(bootstrapTheme);

export const dividerColor = "#000";
export const softDividerColor = "#666";

export const smallSpace = typography.rhythm(.25);
export const mediumSpace = typography.rhythm(.5);
export const largeSpace = typography.rhythm(1);

export const xSmallHeading = typography.scale(.25);
export const smallHeading = typography.scale(.5);
export const mediumHeading = typography.scale(.75);

export const borderWidth = 1;
export const borderStyle = "solid";
export const border = `${borderWidth}px ${borderStyle} ${dividerColor}`;
export const softBorder = `${borderWidth}px ${borderStyle} ${softDividerColor}`;

export const activeBg = "#0af";
export const inactiveBg = "#ccc";
export const textBg = "#fff";

export const inverted = {
  background: dividerColor,
  color: textBg,
};
