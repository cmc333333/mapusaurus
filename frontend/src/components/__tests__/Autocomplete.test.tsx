import { shallow } from "enzyme";
import * as React from "react";

import Autocomplete from "../Autocomplete";

describe("<Autocomplete />", () => {
  it("wraps an Autosuggest", () => {
    const result = shallow(
      <Autocomplete
        fetchFn={jest.fn()}
        setValue={jest.fn()}
      />,
    );
    expect(result.find("Autosuggest")).toHaveLength(1);
  });

  it("fetches data", async () => {
    const fetchFn = jest.fn(() => [1, 2, 3, 4]);
    const result = shallow(
      <Autocomplete
        fetchFn={fetchFn}
        setValue={jest.fn()}
      />,
    );
    const makeRequest: any = result
      .find("Autosuggest")
      .prop("onSuggestionsFetchRequested");

    await makeRequest({ value: "some input" });
    expect(fetchFn).toHaveBeenCalled();
    expect(result.state("suggestions")).toEqual([1, 2, 3, 4]);
  });

  it("can be cleared", () => {
    const result = shallow(
      <Autocomplete
        fetchFn={jest.fn()}
        setValue={jest.fn()}
      />,
    );
    result.setState({ suggestions: [1, 2, 3], value: "123" });

    const makeRequest: any = result
      .find("Autosuggest")
      .prop("onSuggestionsClearRequested");
    makeRequest();
    expect(result.state("suggestions")).toEqual([]);
    expect(result.state("value")).toEqual("");
  });

  it("allows the value to be set", () => {
    const setValue = jest.fn();
    const result = shallow(
      <Autocomplete
        fetchFn={jest.fn()}
        setValue={setValue}
      />,
    );
    const makeRequest: any = result
      .find("Autosuggest")
      .prop("onSuggestionSelected");
    makeRequest(null, { suggestion: 123 });
    expect(setValue).toHaveBeenCalledWith(123);
  });

  it("displays a spinner if loading", () => {
    const result = shallow(
      <Autocomplete
        fetchFn={jest.fn()}
        setValue={jest.fn()}
      />,
    );
    expect(result.find("Loading")).toHaveLength(0);

    result.setState({ loading: true });
    expect(result.find("Loading")).toHaveLength(1);
  });
});
