import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import State from "../../store/State";
import { largeSpace } from "../../theme";
import CountySelector from "./CountySelector";
import LenderSelector from "./LenderSelector";
import MetroSelector from "./MetroSelector";
import StateSelector from "./StateSelector";
import YearSelector from "./YearSelector";

export function HMDAFilters({ showLenders }) {
  return (
    <glamorous.Div margin={largeSpace}>
      <YearSelector />
      <hr />
      <MetroSelector />
      <hr />
      <StateSelector />
      <CountySelector />
      <hr />
      {showLenders && <LenderSelector />}
    </glamorous.Div>
  );
}

export default connect(
  ({ lar: { filters: { county, lender, metro } } }: State) => ({
    showLenders: county.size + lender.size + metro.size > 0,
  }),
)(HMDAFilters);
