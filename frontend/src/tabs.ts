import {
  faGlobe,
  faHome,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";

import ChoroplethSelection from "./components/sidebar/ChoroplethSelection";
import FeatureSelection from "./components/sidebar/FeatureSelection";
import HMDAFilters from "./components/sidebar/HMDAFilters";

export type TabId = "layers" | "features" | "lar";

export class Tab {
  public Component: React.ReactNode;
  public icon: any;
  public id: TabId;
  public title: string;

  constructor(initParams: Partial<Tab>) {
    Object.assign(this, initParams);
  }

  public matches(other: Tab): boolean {
    return this.id === other.id;
  }
}

export default [
  new Tab({
    Component: ChoroplethSelection,
    icon: faLayerGroup,
    id: "layers",
    title: "Demographics",
  }),
  new Tab({
    Component: FeatureSelection,
    icon: faGlobe,
    id: "features",
    title: "Map Features",
  }),
  new Tab({
    Component: HMDAFilters,
    icon: faHome,
    id: "lar",
    title: "HMDA Selection",
  }),
];
