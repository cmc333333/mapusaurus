import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import glamorous from "glamorous";
import { Map } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import { addOptions, FilterConfig, selectFilters } from "../../store/LARLayer";
import {
  inverted,
  largeSpace,
  mediumSpace,
  smallSpace,
  typography,
} from "../../theme";
import Autocomplete from "../Autocomplete";
import FormInput from "../FormInput";

export function ExistingFilter({ name, onClick }) {
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

export function HMDAFilter({
  existing,
  fetchFn,
  label,
  setValue,
  toValue,
}) {
  const lis = existing.map(({ id, name, onClick }) =>
    <ExistingFilter key={id} name={name} onClick={onClick} />,
  );

  return (
    <glamorous.Div marginBottom={largeSpace} marginTop={largeSpace}>
      <FormInput name={label}>
        <Autocomplete fetchFn={fetchFn} setValue={setValue} toValue={toValue} />
      </FormInput>
      <glamorous.Ul listStyle="none" margin={0} marginTop={mediumSpace}>
        {lis}
      </glamorous.Ul>
    </glamorous.Div>
  );
}

export function mergeProps({ larLayer }, { dispatch }, { filterName, searchFn }) {
  const config: FilterConfig<string> = larLayer.filters[filterName];
  const { label } = config;
  const existing = config.selected.toArray()
    .filter(id => config.options.has(id))
    .map(id => ({
      id,
      name: config.options.get(id),
      onClick: ev => {
        ev.preventDefault();
        dispatch(selectFilters.action({
          [filterName]: config.selected.remove(id),
        }));
      },
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const fetchFn = async (str: string) => {
    const result = await searchFn(str, larLayer.year);
    return result.entrySeq().toArray();
  };
  const setValue = ([id, name]) => {
    dispatch(addOptions({ [filterName]: Map([[id, name]]) }));
    dispatch(selectFilters.action({
      [filterName]: config.selected.add(id),
    }));
  };
  const toValue = ([id, name]) => name;

  return { existing, fetchFn, label, setValue, toValue };
}

export default connect(
  ({ larLayer }) => ({ larLayer }),
  dispatch => ({ dispatch }),
  mergeProps,
)(HMDAFilter);
