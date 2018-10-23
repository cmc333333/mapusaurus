import glamorous from "glamorous";
import * as React from "react";

import { largeSpace, xSmallHeading } from "../../theme";
import FilterGroup from "./FilterGroup";
import FilterSelector from "./FilterSelector";

const H3 = glamorous.h3(xSmallHeading);

export default function Filters() {
  return (
    <glamorous.Div margin={largeSpace}>
      <FilterGroup name="Home Purchase" filterGroup="homePurchase">
        <p>Owner-occupied, first lien, 1-4 family home purchases</p>
      </FilterGroup>
      <hr />
      <FilterGroup name="Refinance" filterGroup="refinance">
        <p>Refinancing owner-occupied, first lien, 1-4 family homes</p>
      </FilterGroup>
      <hr />
      <FilterGroup name="Custom" filterGroup="custom">
        <FilterSelector filterId="loanPurpose" label="Loan Purpose" />
        <FilterSelector filterId="propertyType" label="Property Type" />
        <FilterSelector filterId="ownerOccupancy" label="Owner Occupancy" />
        <FilterSelector filterId="lienStatus" label="Lien Status" />
      </FilterGroup>
    </glamorous.Div>
  );
}
