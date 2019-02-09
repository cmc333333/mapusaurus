import { css } from "glamor";
import glamorous from "glamorous";
import { Map } from "immutable";
import * as React from "react";
import * as Autosuggest from "react-autosuggest";

import {
  borderWidth,
  largeSpace,
  mediumSpace,
  smallSpace,
  softBorder,
  textBg,
  typography,
} from "../theme";
import { inputStyle, inputWidth } from "./FormInput";
import Loading from "./Loading";

const autosuggestTheme = {
  input: css(inputStyle, {
    paddingRight: typography.rhythm(1.5),
    width: inputWidth,
  }).toString(),
  suggestion: css({
    borderBottom: softBorder,
    margin: 0,
    padding: mediumSpace,
  }).toString(),
  suggestionHighlighted: css({
    fontWeight: "bold",
  }).toString(),
  suggestionsList: css({
    backgroundColor: textBg,
    border: softBorder,
    listStyle: "none",
    marginTop: `-${borderWidth}px`,
    maxHeight: typography.rhythm(10),
    overflowX: "display",
    overflowY: "auto",
    position: "absolute",
    right: largeSpace,
    width: typography.rhythm(10.5),
  }).toString(),
};

interface Props<T> {
  fetchFn(value: string): Promise<T[]>;
  setValue(input: T): void;
  toString(value: T): string;
}

interface State<T> {
  loading: boolean;
  suggestions: T[];
  value: string;
}

export default class Autocomplete<T>
  extends React.Component<Props<T>, State<T>> {

  constructor(props: Props<T>) {
    super(props);
    this.state = {
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
    const result = await this.props.fetchFn(value);

    this.setState({ loading: false, suggestions: result });
  }

  public render() {
    const inputProps = {
      onChange: (ev, { newValue }) => this.setState({ value: newValue }),
      value: this.state.value,
    };
    const onSuggestionSelected = (ev, { suggestion }) =>
      this.props.setValue(suggestion);
    return (
      <glamorous.Div display="inline-block">
        <glamorous.Div
          paddingTop={smallSpace}
          position="absolute"
          right={typography.rhythm(1.25)}
        >
          {this.state.loading ? <Loading size={largeSpace} /> : null}
        </glamorous.Div>
        <Autosuggest
          getSuggestionValue={this.getSuggestionValue}
          inputProps={inputProps}
          onSuggestionsClearRequested={this.clear}
          onSuggestionSelected={onSuggestionSelected}
          onSuggestionsFetchRequested={this.fetchRequested}
          renderSuggestion={this.renderSuggestion}
          suggestions={this.state.suggestions}
          theme={autosuggestTheme}
        />
      </glamorous.Div>
    );
  }

  public renderSuggestion =
    (suggestion: T) => <>{this.getSuggestionValue(suggestion)}</>
  public getSuggestionValue =
    (suggestion: T) => this.props.toString(suggestion)
}
