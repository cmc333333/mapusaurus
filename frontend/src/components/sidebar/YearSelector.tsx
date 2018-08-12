import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { setYear } from "../../store/LARLayer";
import State from "../../store/State";
import FormInput, { inputStyle } from "../FormInput";

export function YearSelector({ onChange, year, years }) {
  return (
    <FormInput name="Year">
      <glamorous.Select css={inputStyle} onChange={onChange} value={year}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </glamorous.Select>
    </FormInput>
  );
}

export function mapDispatchToProps(dispatch) {
  return {
    onChange: ev => dispatch(setYear(parseInt(ev.target.value, 10))),
  };
}

export default connect(
  ({ larLayer: { year, years } }: State) => ({ year, years }),
  mapDispatchToProps,
)(YearSelector);
