import { shallow } from "enzyme";
import * as React from "react";

import Autocomplete from "../Autocomplete";

describe("<Autocomplete />", () => {
  it("wraps an Autosuggest", () => {
    const result = shallow(
      <Autocomplete
        fetchFn={jest.fn()}
        setValue={jest.fn()}
        toValue={jest.fn()}
      />,
    );
    expect(result.name()).toBe("Autosuggest");
  });

  it("fetches data and caches the result", async () => {
    const fetchFn = jest.fn(() => [1, 2, 3, 4]);
    const result = shallow(
      <Autocomplete
        fetchFn={fetchFn}
        setValue={jest.fn()}
        toValue={jest.fn()}
      />,
    );

    await result.prop("onSuggestionsFetchRequested")({ value: "some input" });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    expect(result.state("suggestions")).toEqual([1, 2, 3, 4]);

    await result.prop("onSuggestionsFetchRequested")({ value: "some input" });
    // Cached, so not called again
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await result.prop("onSuggestionsFetchRequested")({ value: "other input" });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("can be cleared", () => {
    const result = shallow(
      <Autocomplete
        fetchFn={jest.fn()}
        setValue={jest.fn()}
        toValue={jest.fn()}
      />,
    );
    result.setState({ suggestions: [1, 2, 3], value: "123" });

    result.prop("onSuggestionsClearRequested")();
    expect(result.state("suggestions")).toEqual([]);
    expect(result.state("value")).toEqual("");
  });

  it("allows the value to be set", () => {
    const setValue = jest.fn();
    const result = shallow(
      <Autocomplete
        fetchFn={jest.fn()}
        setValue={setValue}
        toValue={jest.fn()}
      />,
    );
    result.prop("onSuggestionSelected")(null, { suggestion: 123 });
    expect(setValue).toHaveBeenCalledWith(123);
  });
});
