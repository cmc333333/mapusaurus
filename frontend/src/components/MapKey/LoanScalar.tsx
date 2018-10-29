import glamorous from "glamorous";
import Slider from "rc-slider";
import * as React from "react";
import { connect } from "react-redux";

import { setScaleFactor } from "../../store/Lar/Points";
import State from "../../store/State";
import {
  border,
  dividerColor,
  largeSpace,
  mediumSpace,
  textBg,
} from "../../theme";

const railStyle = {
  border,
  height: mediumSpace,
};

export function LoanScalar({ onChange, scaleFactor }) {
  return (
    <glamorous.Div paddingLeft={mediumSpace} paddingRight={mediumSpace}>
      <Slider
        handleStyle={{ border, height: largeSpace, width: largeSpace }}
        max={50}
        min={0}
        onChange={onChange}
        railStyle={{ border, backgroundColor: textBg, height: mediumSpace }}
        trackStyle={{ border, backgroundColor: textBg, height: mediumSpace }}
        value={scaleFactor}
      />
    </glamorous.Div>
  );
}

export default connect(
  ({ lar: { points: { scaleFactor } } }: State) => ({ scaleFactor }),
  dispatch => ({
    onChange: scaleFactor => {
      dispatch(setScaleFactor(scaleFactor));
    },
  }),
)(LoanScalar);
