import { connect } from "react-redux";

import { activateTab } from "../../store/Sidebar";
import IconLink from "../IconLink";

export function mergeProps(fromState, { dispatch }, { tab, ...css }) {
  return {
    ...css,
    icon: tab.icon,
    onClick: () => dispatch(activateTab(tab.id)),
    title: tab.title,
  };
}

export default connect(
  null,
  dispatch => ({ dispatch }),
  mergeProps,
)(IconLink);
