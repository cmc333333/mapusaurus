import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { Store } from "../../store/store";
import typography from "../../util/typography";

export function HMDASelection({ geoName, lenderName }) {
  return (
    <glamorous.Div borderTop="1px solid black">
      <glamorous.Div margin={typography.rhythm(1)}>
        <p>{lenderName}</p>
        <p>{geoName}</p>
      </glamorous.Div>
    </glamorous.Div>
  );
}
export default connect(
  ({ hmda }: Store) => ({
    geoName: hmda && hmda.geoName,
    lenderName: hmda && hmda.lenderName,
  }),
)(HMDASelection);
