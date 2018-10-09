import { css } from "glamor";
import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import {
  choiceLookup,
  filterChoices,
  FilterValue,
  setFilters,
} from "../../store/LARLayer";
import State from "../../store/State";
import { border, smallSpace, xLargeSpace } from "../../theme";
import FormInput, { inputStyle } from "../FormInput";

const optionStyle = css(inputStyle, {
  border: "none",
  paddingBottom: smallSpace,
  paddingTop: smallSpace,
});

export function FilterSelector({ filterConfig, onChange, value }) {
  const choices = filterConfig.choices.map(
    filterValue => (
      <glamorous.Option
        css={optionStyle}
        key={filterValue.id}
        value={filterValue.id}
      >
        {filterValue.name}
      </glamorous.Option>
    ),
  );
  return (
    <FormInput fullWidth={true} name={filterConfig.name}>
      <glamorous.Select
        border={border}
        height="6rem"
        multiple={true}
        onChange={onChange}
        value={value}
        width="100%"
      >
        {choices}
      </glamorous.Select>
    </FormInput>
  );
}

export const mapStateToProps = ({ larLayer }: State, { filterId }) => ({
  filterConfig: filterChoices.get(filterId),
  value: larLayer.filters[filterId].map(f => f.id),
});
export const mapDispatchToProps = (dispatch, { filterId }) => ({
  onChange: ev => {
    const values: FilterValue[] = Array.apply(null, ev.target.options)
      .filter(o => o.selected)
      .map(o => choiceLookup[filterId][o.value]);
    return dispatch(setFilters.action({ [filterId]: values }));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(FilterSelector);
