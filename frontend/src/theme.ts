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

export const smallHeading = typography.scale(.5);
export const mediumHeading = typography.scale(.75);

export const border = `1px solid ${dividerColor}`;
export const softBorder = `1px solid ${softDividerColor}`;

export const activeBg = "#0af";
export const textBg = "#fff";
