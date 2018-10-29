import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { MapKeyColor } from "../../mapStyle";
import { mapKeyColorsSelector } from "../../store/Mapbox";
import State from "../../store/State";
import { border, largeSpace, smallSpace, xLargeSpace } from "../../theme";
import LoanCircle from "./LoanCircle";
import LoanScalar from "./LoanScalar";

const Wrapper = glamorous.div({
  border,
  backgroundColor: "#fff",
  bottom: largeSpace,
  padding: smallSpace,
  position: "absolute",
  right: largeSpace,
  textAlign: "center",
  width: "200px",
});
const ColorList = glamorous.ul({
  display: "inline-block",
  listStyle: "none",
  margin: "auto",
  padding: 0,
  textAlign: "left",
});
export const Color = glamorous.li<{ color: string, first: boolean }>(
  { margin: 0 },
  ({ color, first }) => ({
    "::before": {
      backgroundColor: color,
      borderBottom: border,
      borderLeft: border,
      borderRight: border,
      borderTop: first ? border : 0,
      content: " ",
      display: "inline-block",
      height: xLargeSpace,
      marginRight: smallSpace,
      verticalAlign: "middle",
      width: largeSpace,
    },
  }),
);

export function MapKey({ colors, showLar, ...css }) {
  const colorEls = colors.map(({ color, description }, idx) => (
    <Color color={color} key={color} first={idx === 0}>{description}</Color>
  ));
  let lar: JSX.Element | null = null;
  if (showLar) {
    lar = (
      <glamorous.Div marginBottom={smallSpace} marginTop={largeSpace}>
        <div>
          <LoanCircle percentile={.5} />
          <LoanCircle percentile={.7} />
          <LoanCircle percentile={.9} />
        </div>
        <div>Loans per 1k houses</div>
        <LoanScalar />
      </glamorous.Div>
    );
  }

  return (
    <Wrapper css={css}>
      <div><ColorList>{colorEls}</ColorList></div>
      {lar}
    </Wrapper>
  );
}

export const mapStateToProps = ({ lar: { points }, mapbox }: State) => ({
  colors: mapKeyColorsSelector(mapbox),
  showLar: points.raw.length > 0,
});

export default connect(mapStateToProps)(MapKey);
