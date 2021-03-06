import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import State from "../../store/State";
import { largeSpace } from "../../theme";
import CountySelector from "./CountySelector";
import LenderSelector from "./LenderSelector";
import MetroSelector from "./MetroSelector";
import SendReport from "./SendReport";
import StateSelector from "./StateSelector";
import YearSelector from "./YearSelector";

export function HMDAFilters({ showLenders, showSendReport }) {
  const larContent = showLenders && (
    <>
      <YearSelector />
      <hr />
      <LenderSelector />
    </>
  );
  return (
    <glamorous.Div margin={largeSpace}>
      <MetroSelector />
      <hr />
      <StateSelector />
      <CountySelector />
      <hr />
      {larContent}
      {showSendReport && <SendReport />}
    </glamorous.Div>
  );
}

export default connect(
  ({ lar: { filters: { county, lender, metro } } }: State) => ({
    showLenders: county.size + lender.size + metro.size > 0,
    showSendReport: county.size + metro.size > 0,
  }),
)(HMDAFilters);
