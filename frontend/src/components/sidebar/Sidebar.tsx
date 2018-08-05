import {
  faGlobe,
  faHome,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { Tab } from "../../store/Sidebar";
import { border, borderWidth, textBg } from "../../theme";
import ChoroplethSelection from "./ChoroplethSelection";
import FeatureSelection from "./FeatureSelection";
import HMDAFilters from "./HMDAFilters";
import TabLink from "./TabLink";

export function Sidebar({ children, size }) {
  const tabSize = Math.floor((size - borderWidth) / 3);
  return (
    <glamorous.Aside
      background={textBg}
      borderRight={border}
      display="inline-block"
      float="left"
      height="100%"
      width={`${size}px`}
    >
      <glamorous.Ul listStyle="none" margin="0">
        <TabLink icon={faLayerGroup} size={tabSize} tab="layers" />
        <TabLink
          borderLeft={border}
          borderRight={border}
          icon={faGlobe}
          size={tabSize}
          tab="features"
        />
        <TabLink icon={faHome} size={tabSize} tab="lar" />
      </glamorous.Ul>
      <glamorous.Section overflowY="auto" >
        {children}
      </glamorous.Section>
    </glamorous.Aside>
  );
}

function deriveChildren(activeTab: Tab) {
  switch (activeTab) {
    case "layers": return <ChoroplethSelection />;
    case "features": return <FeatureSelection />;
    case "lar": return <HMDAFilters />;
  }
}

export default connect(
  ({ sidebar: { activeTab } }) => ({
    children: deriveChildren(activeTab),
  }),
)(Sidebar);
