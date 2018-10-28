import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { removeFilter } from "../../store/Lar/Filters";
import { updatePoints } from "../../store/Lar/Points";
import {
  inverted,
  largeSpace,
  mediumSpace,
  smallSpace,
  typography,
} from "../../theme";

export function RemovableFilter({ name, onClick }) {
  return (
    <glamorous.Li
      {...inverted}
      borderRadius={mediumSpace}
      paddingBottom={smallSpace}
      paddingLeft={smallSpace}
      paddingRight={largeSpace}
      paddingTop={smallSpace}
      textAlign="center"
    >
      <glamorous.A
        float="right"
        href="#"
        marginRight={typography.rhythm(-.75)}
        onClick={onClick}
        title="Remove"
      >
        <FontAwesomeIcon icon={faTimesCircle} />
      </glamorous.A>
      {name}
    </glamorous.Li>
  );
}

export const mapStateToProps = ({ lar: { lookups } }, { id, filterName }) => ({
  name: filterName === "lender" ?
    lookups.lenders.get(id) :
    lookups.geos.get(id).name,
});

export const mapDispatchToProps = (dispatch, { id, filterName }) => ({
  onClick: ev => {
    ev.preventDefault();
    dispatch(removeFilter({ [filterName]: id }));
    dispatch(updatePoints.action());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(RemovableFilter);
