import glamorous from "glamorous";
import * as React from "react";

import { filterChoices } from "../../store/LARLayer";
import { largeSpace } from "../../theme";
import FilterSelector from "./FilterSelector";

export default function Filters() {
  const selectors = filterChoices.keySeq()
    .map(filterId => <FilterSelector key={filterId} filterId={filterId} />);
  return <glamorous.Div margin={largeSpace}>{selectors}</glamorous.Div>;
}
