import { css } from "glamor";
import glamorous from "glamorous";
import { Set } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import {
  FilterConfig,
  selectFilters,
} from "../../store/LARLayer";
import State from "../../store/State";
import { border, smallSpace, xLargeSpace } from "../../theme";
import FormInput, { inputStyle } from "../FormInput";

const Option = glamorous.option(inputStyle, {
  border: "none",
  paddingBottom: smallSpace,
  paddingTop: smallSpace,
});

export function FilterSelector({ filterConfig, onChange }) {
  const choices = filterConfig.options.entrySeq().toArray().map(
    ([id, name]) => <Option key={id} value={id}>{name}</Option>,
  );
  return (
    <FormInput fullWidth={true} name={filterConfig.label}>
      <glamorous.Select
        border={border}
        height="6rem"
        multiple={true}
        onChange={onChange}
        value={filterConfig.selected.toArray()}
        width="100%"
      >
        {choices}
      </glamorous.Select>
    </FormInput>
  );
}

export const mapStateToProps = ({ larLayer }: State, { filterId }) => ({
  filterConfig: larLayer.filters[filterId],
});
export const mapDispatchToProps = (dispatch, { filterId }) => ({
  onChange: ev => {
    const values: string[] = Array.apply(null, ev.target.options)
      .filter(o => o.selected)
      .map(o => o.value);
    return dispatch(selectFilters.action({ [filterId]: Set(values) }));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(FilterSelector);
