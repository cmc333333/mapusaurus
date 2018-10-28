import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import {
  homePurchasePreset,
  refinancePreset,
  setFilters,
} from "../../store/Lar/Filters";
import { updatePoints } from "../../store/Lar/Points";
import { setGroup } from "../../store/Lar/UIOnly";
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
  ({ lar: { uiOnly } }, { children, filterGroup }) => ({
    checked: filterGroup === uiOnly.group,
    children: filterGroup === uiOnly.group ? children : null,
  });
export const mapDispatchToProps = (dispatch, { filterGroup }) => ({
  onChange: () => {
    dispatch(setGroup(filterGroup));
    if (filterGroup === "homePurchase") {
      dispatch(setFilters(homePurchasePreset));
      dispatch(updatePoints.action());
    } else if (filterGroup === "refinance") {
      dispatch(setFilters(refinancePreset));
      dispatch(updatePoints.action());
    }
  },
});
export default connect(mapStateToProps, mapDispatchToProps)(FilterGroup);
