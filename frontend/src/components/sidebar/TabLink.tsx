import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { activateTab } from "../../store/Sidebar";
import State from "../../store/State";
import {
  activeBg,
  borderStyle,
  borderWidth,
  dividerColor,
  mediumHeading,
  smallSpace,
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
    backgroundColor: active ? activeBg : "inherit",
    borderBottomColor: active ? activeBg : dividerColor,
    width: `${size}px`,
  }),
);

export function TabLink({ activateTab, active, icon, size, ...css }) {
  const onClick = ev => {
    ev.preventDefault();
    activateTab();
  };
  return (
    <glamorous.Li {...css} display="inline-block" margin="0">
      <TabAnchor active={active} href="#" onClick={onClick} size={size}>
        <FontAwesomeIcon icon={icon} />
      </TabAnchor>
    </glamorous.Li>
  );
}

export function mapStateToProps({ sidebar: { activeTab } }: State, { tab }) {
  return {
    active: tab === activeTab,
  };
}

export function mapDispatchToProps(dispatch, { tab }) {
  return {
    activateTab: () => dispatch(activateTab(tab)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TabLink);
