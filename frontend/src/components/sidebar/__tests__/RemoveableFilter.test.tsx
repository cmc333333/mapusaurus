import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import { RemovableFilter } from "../RemovableFilter";

describe("<RemovableFilter />", () => {
  it("renders the correct name", () => {
    const rendered = shallow(
      <RemovableFilter name="NameName" onClick={jest.fn()} />,
    );
    expect(rendered.dive().text()).toMatch("NameName");
  });

  it("calls the remove fn when clicked", () => {
    const onClick = jest.fn();
    const rendered = shallow(
      <RemovableFilter name="" onClick={onClick} />,
    ).find(glamorous.A);
    rendered.simulate("click", { some: "stuff" });
    expect(onClick).toHaveBeenCalledWith({ some: "stuff" });
  });
});
