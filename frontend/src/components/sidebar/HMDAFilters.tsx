import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { searchLenders } from "../../apis/lenders";
import {
  addLender,
  Lender,
  lenderSelector,
  removeLender,
} from "../../store/LARLayer";
import State from "../../store/State";
import HMDAFilter from "./HMDAFilter";

export function mapLenderDispatchToProps(dispatch) {
  return {
    addFn: (lender: Lender) => dispatch(addLender.action(lender)),
    removeFn: (id: string) => dispatch(removeLender.action(id)),
  };
}

export const LenderFilter = connect(
  ({ larLayer }: State) => ({ items: lenderSelector(larLayer) }),
  mapLenderDispatchToProps,
)(HMDAFilter);

export default function HMDASelection() {
  return (
    <glamorous.Section borderTop="1px solid black">
      <LenderFilter searchFn={searchLenders} title="Lenders" />
    </glamorous.Section>
  );
}
