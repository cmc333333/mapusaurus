import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import glamorous from "glamorous";
import { Map } from "immutable";
import * as React from "react";
import { connect } from "react-redux";

import { Geo } from "../../apis/geography";
import LARLayer, {
  addOptions,
  FilterConfig,
  LARFilters,
  selectFilters,
  zoomToGeos,
} from "../../store/LARLayer";
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

export interface HMDAFilterPropTypes<T> {
  existing: { id: string, name: string, onClick: (ev) => void }[];
  fetchFn: (str: string) => Promise<[string, T][]>;
  label: string;
  setValue: (input: [string, T]) => void;
}

export default function HMDAFilter<T>({
  existing,
  fetchFn,
  label,
  setValue,
}: HMDAFilterPropTypes<T>) {
  const toString = ([id, value]) => `${value}`;
  const lis = existing.map(({ id, name, onClick }) =>
    <ExistingFilter key={id} name={name} onClick={onClick} />,
  );

  return (
    <glamorous.Div marginBottom={largeSpace} marginTop={largeSpace}>
      <FormInput name={label}>
        <Autocomplete fetchFn={fetchFn} setValue={setValue} toString={toString} />
      </FormInput>
      <glamorous.Ul listStyle="none" margin={0} marginTop={mediumSpace}>
        {lis}
      </glamorous.Ul>
    </glamorous.Div>
  );
}

export function makeProps<T extends (Geo | string)>(
  filterName: keyof LARFilters,
  larLayer: LARLayer,
  searchFn: (term: string, year: number) => Promise<Map<string, T>>,
  dispatch,
): HMDAFilterPropTypes<T> {
  const config: FilterConfig<Geo | string> = larLayer.filters[filterName];
  const { label } = config;
  const existing = config.selected.toArray()
    .filter(id => config.options.has(id))
    .map(id => ({
      id,
      name: `${config.options.get(id)}`,
      onClick: ev => {
        ev.preventDefault();
        dispatch(selectFilters.action({
          [filterName]: config.selected.remove(id),
        }));
      },
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const fetchFn = async (str: string) => {
    const result: Map<string, T> = await searchFn(str, larLayer.year);
    return result.entrySeq().toArray() as [string, T][];
  };
  const setValue = ([id, value]) => {
    dispatch(addOptions({ [filterName]: Map([[id, value]]) }));
    dispatch(selectFilters.action({
      [filterName]: config.selected.add(id),
    }));
    if (filterName !== "lender") {
      dispatch(zoomToGeos.action());
    }
  };

  return { existing, fetchFn, label, setValue };
}
