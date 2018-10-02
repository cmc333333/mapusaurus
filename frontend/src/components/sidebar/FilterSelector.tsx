import { css } from "glamor";
import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import { filterChoices, FilterValue, setFilters } from "../../store/LARFilters";
import State from "../../store/State";
import { border, smallSpace, xLargeSpace } from "../../theme";
import FormInput, { inputStyle } from "../FormInput";

const optionStyle = css(inputStyle, {
  border: "none",
  paddingBottom: smallSpace,
  paddingTop: smallSpace,
});

export function FilterSelector({ filterConfig, onChange, value }) {
  const choices = filterConfig.choices.entrySeq().map(
    ([value, name]) => (
      <glamorous.Option css={optionStyle} key={value} value={value}>
        {name}
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

export const mapStateToProps = ({ larFilters }: State, { filterId }) => ({
  filterConfig: filterChoices.get(filterId),
  value: larFilters[filterId].toArray(),
});
export const mapDispatchToProps = (dispatch, { filterId }) => ({
  onChange: ev => {
    const values: FilterValue[] = Array.apply(null, ev.target.options)
      .filter(o => o.selected)
      .map(o => o.value);
    return dispatch(setFilters([filterId, Set(values)]));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(FilterSelector);
