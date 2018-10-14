import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { searchMetros } from "../../apis/geography";
import { searchLenders } from "../../apis/lenders";
import State from "../../store/State";
import { largeSpace } from "../../theme";
import CountySelector from "./CountySelector";
import HMDAFilter, { makeProps } from "./HMDAFilter";
import YearSelector from "./YearSelector";

const LenderFilter = connect(
  ({ larLayer }) => ({ larLayer }),
  dispatch => ({ dispatch }),
  ({ larLayer }, { dispatch }) => makeProps(
    "lender",
    larLayer,
    searchLenders,
    dispatch,
  ),
)(HMDAFilter);
const MetroFilter = connect(
  ({ larLayer }) => ({ larLayer }),
  dispatch => ({ dispatch }),
  ({ larLayer }, { dispatch }) => makeProps(
    "metro",
    larLayer,
    searchMetros,
    dispatch,
  ),
)(HMDAFilter);

export function HMDAFilters({ showLenders }) {
  return (
    <glamorous.Div margin={largeSpace}>
      <YearSelector />
      <hr />
      <MetroFilter />
      <hr />
      <CountySelector />
      <hr />
      {showLenders && <LenderFilter />}
    </glamorous.Div>
  );
}

export default connect(
  ({ larLayer: { filters: { county, lender, metro } } }: State) => ({
    showLenders:
      county.selected.size + lender.selected.size + metro.selected.size > 0,
  }),
)(HMDAFilters);
