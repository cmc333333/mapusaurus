import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import {
  countyNamesSelector,
  lenderNamesSelector,
  metroNamesSelector,
} from "../../store/LARLayer";
import State from "../../store/State";
import typography from "../../util/typography";

export function HMDASelection({ countyNames, lenderNames, metroNames }) {
  return (
    <glamorous.Div borderTop="1px solid black">
      <glamorous.Div margin={typography.rhythm(1)}>
        <ul>{countyNames.map(n => <li key={n}>{n}</li>)}</ul>
        <ul>{lenderNames.map(n => <li key={n}>{n}</li>)}</ul>
        <ul>{metroNames.map(n => <li key={n}>{n}</li>)}</ul>
      </glamorous.Div>
    </glamorous.Div>
  );
}
export default connect(
  ({ larLayer }: State) => ({
    countyNames: countyNamesSelector(larLayer),
    lenderNames: lenderNamesSelector(larLayer),
    metroNames: metroNamesSelector(larLayer),
  }),
)(HMDASelection);
