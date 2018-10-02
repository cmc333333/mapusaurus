import { css } from "glamor";
import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { activeTabSelector } from "../../store/Sidebar";
import tabs from "../../tabs";
import {
  border,
  borderStyle,
  borderWidth,
  dividerColor,
  inactiveBg,
  mediumHeading,
  smallHeading,
  smallSpace,
  textBg,
  typography,
} from "../../theme";
import Expander from "./Expander";
import TabLink from "./TabLink";

const tabHeight = 50;
const headingHeight = 40;
const sidebarWidth = 300;

const headingStyle = css({
  ...smallHeading,
  lineHeight: `${headingHeight}px`,
  marginBottom: 0,
  textAlign: "center",
});

export function Sidebar({ activeTab, expanded }) {
  const tabSize = Math.floor(sidebarWidth / 4);
  const contentHeight = expanded
    ? `calc(100% - ${tabHeight + 2 * headingHeight + 2 * borderWidth}px)`
    : "0";
  const tabLinks = tabs.map((tab, idx) => (
    <glamorous.Li
      {...mediumHeading}
      borderBottomColor={tab.matches(activeTab) ? "transparent" : dividerColor}
      borderBottomStyle={borderStyle}
      borderBottomWidth={`${borderWidth}px`}
      borderLeft={idx ? border : "none"}
      display="inline-block"
      key={tab.id}
      margin="0"
    >
      <TabLink
        backgroundColor={tab.matches(activeTab) ? "inherit" : inactiveBg}
        display="inline-block"
        height={`${tabHeight}px`}
        padding={smallSpace}
        tab={tab}
        textAlign="center"
        width={`${tabSize - borderWidth}px`}
      />
    </glamorous.Li>
  ));
  return (
    <glamorous.Aside
      background={textBg}
      borderBottom={expanded ? "none" : border}
      borderRight={border}
      display="inline-block"
      height={expanded ? "100%" : "auto"}
      left="0"
      position="absolute"
      top="0"
      width={`${sidebarWidth}px`}
    >
      <glamorous.Ul listStyle="none" margin="0">
        {tabLinks}
      </glamorous.Ul>
      <glamorous.H2
        {...headingStyle}
        height={expanded ? `${headingHeight}px` : "0"}
        overflowY="hidden"
      >
        {activeTab.title}
      </glamorous.H2>
      <glamorous.Section
        borderBottom={expanded ? border : "none"}
        borderTop={expanded ? border : "none"}
        height={contentHeight}
        overflowY={expanded ? "auto" : "hidden"}
      >
        <activeTab.Component />
      </glamorous.Section>
      <Expander
        {...headingStyle}
        display="block"
        height={`${headingHeight}px`}
      />
    </glamorous.Aside>
  );
}

export default connect(
  ({ sidebar }) => ({
    activeTab: activeTabSelector(sidebar),
    expanded: sidebar.expanded,
  }),
)(Sidebar);
