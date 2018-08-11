import { css } from "glamor";
import glamorous from "glamorous";
import { Map } from "immutable";
import * as React from "react";
import * as Autosuggest from "react-autosuggest";

import {
  border,
  largeSpace,
  mediumSpace,
  smallSpace,
  softBorder,
  typography,
} from "../theme";
import Loading from "./Loading";

const autosuggestTheme = {
  input: css({
    border,
    paddingBottom: smallSpace,
    paddingLeft: mediumSpace,
    paddingRight: typography.rhythm(2),
    paddingTop: smallSpace,
    width: "100%",
  }).toString(),
  suggestion: css({
    borderBottom: softBorder,
    margin: 0,
    padding: mediumSpace,
    width: "100%",
  }).toString(),
  suggestionHighlighted: css({
    fontWeight: "bold",
  }).toString(),
  suggestionsList: css({
    borderBottom: softBorder,
    borderLeft: softBorder,
    borderRight: softBorder,
    listStyle: "none",
    margin: 0,
    maxHeight: typography.rhythm(10),
    overflowY: "auto",
  }).toString(),
};

interface Props<T> {
  fetchFn(value: string): Promise<T[]>;
  setValue(input: T): void;
  toValue(input: T): string;
}

interface State<T> {
  cache: Map<string, T[]>;
  loading: boolean;
  suggestions: T[];
  value: string;
}

export default class Autocomplete<T>
  extends React.Component<Props<T>, State<T>> {

  constructor(props: Props<T>) {
    super(props);
    this.state = {
      cache: Map<string, T[]>(),
      loading: false,
      suggestions: [],
      value: "",
    };
  }

  public clear = () => {
    this.setState({ loading: false, suggestions: [], value: "" });
  }

  public fetchRequested = async ({ value }): Promise<void> => {
    this.setState({ loading: true });
    if (!this.state.cache.has(value)) {
      const result = await this.props.fetchFn(value);
      this.setState({ cache: this.state.cache.set(value, result) });
    }

    this.setState({
      loading: false,
      suggestions: this.state.cache.get(value) || [],
    });
  }

  public render() {
    const inputProps = {
      onChange: (ev, { newValue }) => this.setState({ value: newValue }),
      value: this.state.value,
    };
    const onSuggestionSelected = (ev, { suggestion }) =>
      this.props.setValue(suggestion);
    return (
      <glamorous.Div position="relative">
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
        <glamorous.Div position="absolute" right={smallSpace} top={smallSpace}>
          {this.state.loading ? <Loading size={largeSpace} /> : null}
        </glamorous.Div>
      </glamorous.Div>
    );
  }

  public renderSuggestion =
    (suggestion: T) => <>{this.props.toValue(suggestion)}</>
}
