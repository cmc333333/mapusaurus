import { css } from "glamor";
import { Map } from "immutable";
import * as React from "react";
import * as Autosuggest from "react-autosuggest";

import { border, mediumSpace, smallSpace, softBorder } from "../theme";

const inputStyle = css({
  border,
  paddingBottom: smallSpace,
  paddingLeft: mediumSpace,
  paddingRight: mediumSpace,
  paddingTop: smallSpace,
  width: "100%",
});
const suggestionHighlightedStyle = css({
  fontWeight: "bold",
});
const suggestionListStyle = css({
  borderBottom: softBorder,
  borderLeft: softBorder,
  borderRight: softBorder,
  listStyle: "none",
  margin: 0,
  maxHeight: "10rem",
  overflowY: "auto",
});
const suggestionStyle = css({
  borderBottom: softBorder,
  margin: 0,
  padding: mediumSpace,
  width: "100%",
});
const autosuggestTheme = {
  input: inputStyle.toString(),
  suggestion: suggestionStyle.toString(),
  suggestionHighlighted: suggestionHighlightedStyle.toString(),
  suggestionsList: suggestionListStyle.toString(),
};

interface Props<T> {
  fetchFn(value: string): Promise<T[]>;
  setValue(input: T): void;
  toValue(input: T): string;
}

interface State<T> {
  cache: Map<string, T[]>;
  suggestions: T[];
  value: string;
}

export default class Autocomplete<T>
  extends React.Component<Props<T>, State<T>> {

  constructor(props: Props<T>) {
    super(props);
    this.state = {
      cache: Map<string, T[]>(),
      suggestions: [],
      value: "",
    };
  }

  public clear = () => {
    this.setState({ suggestions: [], value: "" });
  }

  public fetchRequested = async ({ value }): Promise<void> => {
    if (!this.state.cache.has(value)) {
      const result = await this.props.fetchFn(value);
      this.setState({ cache: this.state.cache.set(value, result) });
    }

    this.setState({ suggestions: this.state.cache.get(value) || [] });
  }

  public render() {
    const inputProps = {
      onChange: (ev, { newValue }) => this.setState({ value: newValue }),
      value: this.state.value,
    };
    const onSuggestionSelected = (ev, { suggestion }) =>
      this.props.setValue(suggestion);
    return (
      <Autosuggest
        getSuggestionValue={this.props.toValue}
        inputProps={inputProps}
        onSuggestionsClearRequested={this.clear}
        onSuggestionSelected={onSuggestionSelected}
        onSuggestionsFetchRequested={this.fetchRequested}
        renderSuggestion={this.renderSuggestion}
        suggestions={this.state.suggestions}
        theme={autosuggestTheme}
      />
    );
  }

  public renderSuggestion =
    (suggestion: T) => <>{this.props.toValue(suggestion)}</>
}
