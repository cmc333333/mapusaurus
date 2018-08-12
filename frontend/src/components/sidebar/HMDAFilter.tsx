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
  typography,
} from "../../theme";
import Autocomplete from "../Autocomplete";
import FormInput from "../FormInput";

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
      textAlign="center"
    >
      <glamorous.A
        float="right"
        href="#"
        marginRight={typography.rhythm(-.75)}
        onClick={removeClick}
        title="Remove"
      >
        <FontAwesomeIcon icon={faTimesCircle} />
      </glamorous.A>
      {filter.name}
    </glamorous.Li>
  );
}

export function HMDAFilter({
  addFn,
  items,
  removeFn,
  searchFn,
  title,
  year,
}) {
  const props = {
    fetchFn: (value: string) => searchFn(value, year),
    setValue: addFn,
    toValue: input => input.name || "",
  };
  const lis = items.map(
    item => <ExistingFilter filter={item} key={item.id} removeFn={removeFn} />,
  );
  return (
    <glamorous.Div marginBottom={largeSpace} marginTop={largeSpace}>
      <FormInput name={title}>
        <Autocomplete {...props} />
      </FormInput>
      <glamorous.Ul listStyle="none" margin={0} marginTop={mediumSpace}>
        {lis}
      </glamorous.Ul>
    </glamorous.Div>
  );
}

export default connect(
  ({ larLayer: { year } }) => ({ year }),
  dispatch => ({
    addFn: (filter: FilterEntity) => dispatch(addFilters.action([filter])),
    removeFn: (filter: FilterEntity) => dispatch(removeFilter.action(filter)),
  }),
)(HMDAFilter);
