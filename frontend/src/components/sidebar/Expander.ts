import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { connect } from "react-redux";

import { collapse, expand } from "../../store/Sidebar";
import IconLink from "../IconLink";

export function mergeProps({ expanded }, { dispatch }, ownProps) {
  return {
    ...ownProps,
    icon: expanded ? faChevronUp : faChevronDown,
    onClick: () => {
      const action = expanded ? collapse : expand;
      dispatch(action());
    },
    title: expanded ? "Hide Sidebar" : "Expand Sidebar",
  };
}

export default connect(
  ({ sidebar: { expanded } }) => ({ expanded }),
  dispatch => ({ dispatch }),
  mergeProps,
)(IconLink);
