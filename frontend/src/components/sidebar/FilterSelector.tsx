import { css } from "glamor";
import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import { nameLookups, setFilters } from "../../store/Lar/Filters";
import { updatePoints } from "../../store/Lar/Points";
import { border, smallSpace, xLargeSpace } from "../../theme";
import FormInput, { inputStyle } from "../FormInput";

const Option = glamorous.option(inputStyle, {
  border: "none",
  paddingBottom: smallSpace,
  paddingTop: smallSpace,
});

export function FilterSelector({ label, nameMapping, onChange, value }) {
  const choices = Object.keys(nameMapping).sort()
    .map(id => <Option key={id} value={id}>{nameMapping[id]}</Option>);
  return (
    <FormInput fullWidth={true} name={label}>
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

export const mapStateToProps = ({ lar: { filters } }, { filterId }) => ({
  nameMapping: nameLookups[filterId],
  value: filters[filterId].toArray(),
});
export const mapDispatchToProps = (dispatch, { filterId }) => ({
  onChange: ev => {
    const values: string[] = Array.apply(null, ev.target.options)
      .filter(o => o.selected)
      .map(o => o.value);
    dispatch(setFilters({ [filterId]: Set(values) }));
    dispatch(updatePoints.action());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(FilterSelector);
