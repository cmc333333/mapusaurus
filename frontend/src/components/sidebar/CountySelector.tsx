import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { makeCountySearch } from "../../apis/geography";
import { setStateFips } from "../../store/LARLayer";
import State from "../../store/State";
import FormInput, { inputStyle } from "../FormInput";
import HMDAFilter, { makeProps } from "./HMDAFilter";

const CountyAutocomplete = connect(
  ({ larLayer }) => ({ larLayer }),
  dispatch => ({ dispatch }),
  ({ larLayer }, { dispatch }, { searchFn }) => makeProps(
    "county",
    larLayer,
    searchFn,
    dispatch,
  ),
)(HMDAFilter);

export function CountySelector({
  onChange,
  searchCounties,
  stateFips,
  states,
}) {
  return (
    <>
      <FormInput name="State">
        <glamorous.Select
          css={inputStyle}
          onChange={onChange}
          value={stateFips}
          width="150px"
        >
          {states.map(s => <option key={s.fips} value={s.fips}>{s.name}</option>)}
        </glamorous.Select>
      </FormInput>
      <CountyAutocomplete searchFn={searchCounties} />
    </>
  );
}

export function mapStateToProps({ larLayer }: State) {
  const { available: { states }, filters, stateFips } = larLayer;
  return {
    stateFips,
    states,
    searchCounties: makeCountySearch(stateFips),
  };
}

export function mapDispatchToProps(dispatch) {
  return {
    onChange: ev => dispatch(setStateFips(ev.target.value)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CountySelector);
