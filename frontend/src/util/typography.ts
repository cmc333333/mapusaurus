import * as Typography from "typography";
import * as bootstrapTheme from "typography-theme-bootstrap";

bootstrapTheme.overrideThemeStyles = ({ rhythm }, options) => ({
  a: {
    color: "inherit",
    textDecoration: "none",
  },
});

export default new Typography(bootstrapTheme);
