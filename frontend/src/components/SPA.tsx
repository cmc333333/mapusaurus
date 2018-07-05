import glamorous from "glamorous";
import * as React from "react";

import Map from "./Map";
import ChoroplethSelection from "./sidebar/ChoroplethSelection";
import FeatureSelection from "./sidebar/FeatureSelection";
import HMDASelection from "./sidebar/HMDASelection";

export default function SPA() {
  return (
    <>
      <glamorous.Aside
        background="white"
        borderRight="solid 1px black"
        display="inline-block"
        float="left"
        height="100%"
        overflowY="auto"
        width="300px"
      >
        <ChoroplethSelection />
        <FeatureSelection />
        <HMDASelection />
      </glamorous.Aside>
      <glamorous.Div
        marginLeft="300px"
      >
        <Map />
      </glamorous.Div>
    </>
  );
}
