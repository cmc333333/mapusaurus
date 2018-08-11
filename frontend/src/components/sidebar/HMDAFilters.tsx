import * as React from "react";
import { connect } from "react-redux";

import { searchMetros } from "../../apis/geography";
import { searchLenders } from "../../apis/lenders";
import State from "../../store/State";
import HMDAFilter from "./HMDAFilter";

export function HMDAFilters({ lenders, metros, showLenders }) {
  let lendersEl: JSX.Element | null = null;
  if (showLenders) {
    lendersEl = (
      <HMDAFilter items={lenders} searchFn={searchLenders} title="Lenders" />
    );
  }
  return (
    <>
      <HMDAFilter items={metros} searchFn={searchMetros} title="Metros" />
      {lendersEl}
    </>
  );
}

export default connect(
  ({ larLayer: { filters } }: State) => ({
    lenders: filters.filter(e => e.name && e.entityType === "lender"),
    metros: filters.filter(e => e.name && e.entityType === "metro"),
    showLenders: filters.length > 0,
  }),
)(HMDAFilters);
