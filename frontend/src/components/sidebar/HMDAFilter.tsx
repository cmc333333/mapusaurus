import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import glamorous from "glamorous";
import * as React from "react";
import { connect } from "react-redux";

import { addFilters, FilterEntity, removeFilter } from "../../store/LARLayer";
import {
  inverted,
  largeSpace,
  mediumSpace,
  smallSpace,
  xSmallHeading,
} from "../../theme";
import Autocomplete from "../Autocomplete";

export function ExistingFilter({ filter, removeFn }) {
  const removeClick = ev => {
    ev.preventDefault();
    removeFn(filter);
  };
  return (
    <glamorous.Li
      {...inverted}
      borderRadius={mediumSpace}
      paddingBottom={smallSpace}
      paddingLeft={smallSpace}
      paddingRight={largeSpace}
      paddingTop={smallSpace}
      position="relative"
      textAlign="center"
    >
      {filter.name}
      <glamorous.A
        href="#"
        onClick={removeClick}
        position="absolute"
        right={smallSpace}
        title="Remove"
        top={smallSpace}
      >
        <FontAwesomeIcon icon={faTimesCircle} />
      </glamorous.A>
    </glamorous.Li>
  );
}

export function HMDAFilter({
  addFn,
  items,
  removeFn,
  searchFn,
  title,
}) {
  const props = {
    fetchFn: (value: string) => searchFn(value, 2016),
    setValue: addFn,
    toValue: input => input.name || "",
  };
  const lis = items.map(
    item => <ExistingFilter filter={item} key={item.id} removeFn={removeFn} />,
  );
  return (
    <glamorous.Div margin={largeSpace}>
      <glamorous.H3 {...xSmallHeading} marginBottom={mediumSpace}>
        {title}
      </glamorous.H3>
      <Autocomplete {...props} />
      <glamorous.Ul listStyle="none" margin={0} marginTop={mediumSpace}>
        {lis}
      </glamorous.Ul>
    </glamorous.Div>
  );
}

export default connect(
  null,
  dispatch => ({
    addFn: (filter: FilterEntity) => dispatch(addFilters.action([filter])),
    removeFn: (filter: FilterEntity) => dispatch(removeFilter.action(filter)),
  }),
)(HMDAFilter);
