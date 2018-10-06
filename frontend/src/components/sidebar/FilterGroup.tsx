import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { setFilterGroup } from "../../store/LARLayer";
import State from "../../store/State";
import { xLargeSpace } from "../../theme";
import FormInput from "../FormInput";

interface PropsType {
  checked: boolean;
  children?: JSX.Element | JSX.Element[];
  name: string;
  onChange: () => void;
}
export function FilterGroup({ checked, children, name, onChange }: PropsType) {
  return (
    <>
      <FormInput name={name}>
        <glamorous.Input
          checked={checked}
          height={xLargeSpace}
          onChange={onChange}
          type="radio"
        />
      </FormInput>
      {children}
    </>
  );
}

export const mapStateToProps =
  ({ larLayer }: State, { children, filterGroup }) => ({
    checked: filterGroup === larLayer.filterGroup,
    children: filterGroup === larLayer.filterGroup ? children : null,
  });
export const mapDispatchToProps = (dispatch, { filterGroup }) => ({
  onChange: () => dispatch(setFilterGroup.action(filterGroup)),
});
export default connect(mapStateToProps, mapDispatchToProps)(FilterGroup);
