import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { searchMetros } from "../../apis/geography";
import { searchLenders } from "../../apis/lenders";
import State from "../../store/State";
import { largeSpace } from "../../theme";
import CountySelector from "./CountySelector";
import HMDAFilter from "./HMDAFilter";
import YearSelector from "./YearSelector";

export function HMDAFilters({ lenders, metros, showLenders }) {
  let lendersEl: JSX.Element | null = null;
  if (showLenders) {
    lendersEl = (
      <HMDAFilter items={lenders} searchFn={searchLenders} title="Lenders" />
    );
  }
  return (
    <glamorous.Div margin={largeSpace}>
      <YearSelector />
      <hr />
      <HMDAFilter items={metros} searchFn={searchMetros} title="Metros" />
      <hr />
      <CountySelector />
      <hr />
      {lendersEl}
    </glamorous.Div>
  );
}

export default connect(
  ({ larLayer: { filters } }: State) => ({
    lenders: filters.filter(e => e.name && e.entityType === "lender"),
    metros: filters.filter(e => e.name && e.entityType === "metro"),
    showLenders: filters.length > 0,
  }),
)(HMDAFilters);
