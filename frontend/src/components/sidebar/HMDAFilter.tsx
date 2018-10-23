import glamorous from "glamorous";
import * as React from "react";

import { largeSpace, mediumSpace } from "../../theme";
import Autocomplete from "../Autocomplete";
import FormInput from "../FormInput";
import RemovableFilter from "./RemovableFilter";

export default function HMDAFilter({
  existing,
  fetchFn,
  fieldName,
  label,
  setValue,
}) {
  const toString = ([id, value]) => `${value}`;
  const lis = existing.map(
    id => <RemovableFilter id={id} key={id} filterName={fieldName} />,
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
