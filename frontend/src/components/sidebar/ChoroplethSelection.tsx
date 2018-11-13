import glamorous from "glamorous";
import * as React from "react";

import { allChoropleths } from "../../mapStyle";
import ChoroplethLink from "./ChoroplethLink";

export default function ChoroplethSelection() {
  const links = allChoropleths.entrySeq().toArray()
    .map(([layerId, name]) =>
      <ChoroplethLink layerId={layerId} key={layerId} name={name} />,
    );
  return <glamorous.Ul margin="0">{links}</glamorous.Ul>;
}
