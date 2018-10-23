import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import { StateSelector } from "../StateSelector";

describe("<StateSelector />", () => {
  it("includes an option per state", () => {
    const rendered = shallow(
      <StateSelector onChange={jest.fn()} value="01" />,
    );
    expect(rendered.find("option")).toHaveLength(51);
  });

  it("shows the selected state", () => {
    const rendered = shallow(
      <StateSelector onChange={jest.fn()} value="02" />,
    );
    expect(rendered.find(glamorous.Select).prop("value")).toBe("02");
  });

  it("triggers the right onChange", () => {
    const onChange = jest.fn();
    const rendered = shallow(
      <StateSelector onChange={onChange} value="02" />,
    );
    rendered.find(glamorous.Select)
      .simulate("change", { target: { value: "05" } });
    expect(onChange).toHaveBeenCalledWith({ target: { value: "05" } });
  });
});
