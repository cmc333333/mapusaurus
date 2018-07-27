import glamorous from "glamorous";
import * as React from "react";

import typography from "../../util/typography";
import Autocomplete from "../Autocomplete";

export function ExistingFilter({ id, name, removeFn }) {
  const removeClick = ev => {
    ev.preventDefault();
    removeFn(id);
  };
  return (
    <li>
      {name}
      <glamorous.A float="right" href="#" onClick={removeClick}>x</glamorous.A>
    </li>
  );
}

export default function HMDAFilter({
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
    item => <ExistingFilter key={item.id} removeFn={removeFn} {...item} />,
  );
  return (
    <glamorous.Div margin={typography.rhythm(1)}>
      <glamorous.H3
        marginBottom={typography.rhythm(.5)}
        {...typography.scale(.5)}
      >
        {title}
      </glamorous.H3>
      <Autocomplete {...props} />
      <glamorous.Ul
        listStyle="none"
        margin={0}
        marginTop={typography.rhythm(.5)}
      >
        {lis}
      </glamorous.Ul>
    </glamorous.Div>
  );
}
