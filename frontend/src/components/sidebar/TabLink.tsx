import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { activateTab } from "../../store/Sidebar";
import State from "../../store/State";
import {
  borderStyle,
  borderWidth,
  dividerColor,
  inactiveBg,
  mediumHeading,
  smallSpace,
  textBg,
} from "../../theme";

const TabAnchor = glamorous.a<{ active: boolean, size: number }>(
  {
    ...mediumHeading,
    borderBottomStyle: borderStyle,
    borderBottomWidth: `${borderWidth}px`,
    display: "inline-block",
    padding: smallSpace,
    textAlign: "center",
  },
  ({ active, size }) => ({
    backgroundColor: active ? "inherit" : inactiveBg,
    borderBottomColor: active ? textBg : dividerColor,
    width: `${size}px`,
  }),
);

export function TabLink({ activateTab, active, size, tab, ...css }) {
  const onClick = ev => {
    ev.preventDefault();
    activateTab();
  };
  return (
    <glamorous.Li {...css} display="inline-block" margin="0">
      <TabAnchor
        active={active}
        href="#"
        onClick={onClick}
        size={size}
        title={tab.title}
      >
        <FontAwesomeIcon icon={tab.icon} />
      </TabAnchor>
    </glamorous.Li>
  );
}

export function mapStateToProps({ sidebar: { activeTabId } }: State, { tab }) {
  return {
    active: tab.id === activeTabId,
  };
}

export function mapDispatchToProps(dispatch, { tab }) {
  return {
    activateTab: () => dispatch(activateTab(tab.id)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TabLink);
