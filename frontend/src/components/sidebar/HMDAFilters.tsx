import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { searchMetros } from "../../apis/geography";
import { searchLenders } from "../../apis/lenders";
import State from "../../store/State";
import HMDAFilter from "./HMDAFilter";

export function HMDAFilters({ lenders, metros }) {
  return (
    <glamorous.Section borderTop="1px solid black">
      <HMDAFilter items={metros} searchFn={searchMetros} title="Metros" />
      <HMDAFilter items={lenders} searchFn={searchLenders} title="Lenders" />
    </glamorous.Section>
  );
}

export default connect(
  ({ larLayer: { filters } }: State) => ({
    lenders: filters.filter(e => e.name && e.entityType === "lender"),
    metros: filters.filter(e => e.name && e.entityType === "metro"),
  }),
)(HMDAFilters);
