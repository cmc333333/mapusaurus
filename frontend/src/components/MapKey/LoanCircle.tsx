import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { radius, scalarSelector } from "../../store/Lar/Points";
import State from "../../store/State";
import { pixelsPerMeterSelector } from "../../store/Viewport";
import { smallSpace } from "../../theme";

export const CircleWrapper = glamorous.div({
  display: "inline-block",
  paddingLeft: smallSpace,
  paddingRight: smallSpace,
  textAlign: "center",
  width: "33%",
});
export const InnerWrapper = glamorous.div({
  maxHeight: "100px",
  overflow: "hidden",
});

export function LoanCircle({ height, text, width }) {
  return (
    <CircleWrapper>
      <InnerWrapper>
        <glamorous.Div
          backgroundColor="#000"
          borderRadius="50%"
          display="inline-block"
          height={`${height}px`}
          width={`${width}px`}
        />
      </InnerWrapper>
      <div>{text}</div>
    </CircleWrapper>
  );
}

export function mapStateToProps(
  { lar: { points }, viewport }: State,
  { percentile }: { percentile: number },
): { height: number, text: string, width: number } {
  const { x, y } = pixelsPerMeterSelector(viewport);
  const scalar = scalarSelector(points);
  const point = points.raw[Math.floor(percentile * (points.raw.length - 1))];
  const radMeters = radius(point.normalizedLoans * scalar);
  return {
    height: 2 * radMeters * y,
    text: (point.normalizedLoans * 1000).toFixed(1),
    width: 2 * radMeters * x,
  };
}

export default connect(mapStateToProps)(LoanCircle);
