import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { activeTabSelector } from "../../store/Sidebar";
import tabs from "../../tabs";
import {
  border,
  borderWidth,
  smallHeading,
  textBg,
  typography,
} from "../../theme";
import TabLink from "./TabLink";

export function Sidebar({ activeTab, size }) {
  const tabSize = Math.floor((size - borderWidth) / 3);
  const tabLinks = tabs.map((tab, idx) => (
    <TabLink
      borderRight={idx === tabs.length - 1 ? "none" : border}
      key={tab.id}
      tab={tab}
      size={tabSize}
    />
  ));
  return (
    <glamorous.Aside
      background={textBg}
      borderRight={border}
      display="inline-block"
      height="100%"
      left="0"
      position="absolute"
      top="0"
      width={`${size}px`}
    >
      <glamorous.Ul listStyle="none" margin="0">
        {tabLinks}
      </glamorous.Ul>
      <glamorous.H2
        {...smallHeading}
        borderBottom={border}
        marginBottom={0}
        textAlign="center"
      >
        {activeTab.title}
      </glamorous.H2>
      <glamorous.Section
        height={`calc(100% - ${typography.rhythm(3.75)})`}
        overflowY="auto"
      >
        <activeTab.Component />
      </glamorous.Section>
    </glamorous.Aside>
  );
}

export default connect(
  ({ sidebar }) => ({ activeTab: activeTabSelector(sidebar) }),
)(Sidebar);
