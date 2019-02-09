import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { setState, stateNames } from "../../store/Lar/UIOnly";
import FormInput, { inputStyle, inputWidth } from "../FormInput";

export function StateSelector({ onChange, value }) {
  const stateOptions = Object.keys(stateNames).sort().map(
    fips => <option key={fips} value={fips}>{stateNames[fips]}</option>,
  );

  return (
    <FormInput name="State">
      <glamorous.Select
        css={inputStyle}
        onChange={onChange}
        value={value}
        width={inputWidth}
      >
        {stateOptions}
      </glamorous.Select>
    </FormInput>
  );
}

export default connect(
  ({ lar: { uiOnly: { state } } }) => ({ value: state }),
  dispatch => ({
    onChange: ev => dispatch(setState(ev.target.value)),
  }),
)(StateSelector);
