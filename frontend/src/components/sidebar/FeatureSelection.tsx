import glamorous from "glamorous";
import * as React from "react";

import { features } from "../../mapStyle";
import FeatureCheckbox from "./FeatureCheckbox";

export default function FeatureSelection() {
  const checkBoxes = features.entrySeq().toArray()
    .map((pair: [string, Set<string>]) => {
      const [name, layerIds] = pair;
      return <FeatureCheckbox key={name} layerIds={layerIds} name={name} />;
    });
  return <glamorous.Ul margin="0">{checkBoxes}</glamorous.Ul>;
}
