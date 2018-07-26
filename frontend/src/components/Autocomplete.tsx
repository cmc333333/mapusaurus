import { css } from "glamor";
import { Map } from "immutable";
import * as React from "react";
import * as Autosuggest from "react-autosuggest";

import typography from "../util/typography";

const inputStyle = css({
  border: "1px solid black",
  paddingBottom: typography.rhythm(.25),
  paddingLeft: typography.rhythm(.5),
  paddingRight: typography.rhythm(.5),
  paddingTop: typography.rhythm(.25),
  width: "100%",
});
const suggestionHighlightedStyle = css({
  fontWeight: "bold",
});
const suggestionListStyle = css({
  borderBottom: "1px solid grey",
  borderLeft: "1px solid grey",
  borderRight: "1px solid grey",
  listStyle: "none",
  margin: 0,
  maxHeight: typography.rhythm(10),
  overflowY: "auto",
});
const suggestionStyle = css({
  borderBottom: "1px solid grey",
  margin: 0,
  padding: typography.rhythm(.5),
  width: "100%",
});
const theme = {
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
        theme={theme}
      />
    );
  }

  public renderSuggestion =
    (suggestion: T) => <>{this.props.toValue(suggestion)}</>
}
