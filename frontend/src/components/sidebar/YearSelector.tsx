import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import { setFilters } from "../../store/Lar/Filters";
import { GeoId, LenderId } from "../../store/Lar/Lookups";
import { updatePoints } from "../../store/Lar/Points";
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

export const mapDispatchToProps = dispatch => ({
  onChange: ev => {
    dispatch(setFilters({
      county: Set<GeoId>(),
      lender: Set<LenderId>(),
      metro: Set<GeoId>(),
      year: parseInt(ev.target.value, 10),
    }));
    dispatch(updatePoints.action());
  },
});

export default connect(
  ({ lar: { filters: { year }, lookups: { years } } }) => ({ year, years }),
  mapDispatchToProps,
)(YearSelector);
