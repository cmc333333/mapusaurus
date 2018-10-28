import { shallow } from "enzyme";
import * as React from "react";

import { Color, MapKey } from "../index";
import LoanCircle from "../LoanCircle";

describe("<MapKey />", () => {
  it("includes the relevant colors", () => {
    const colors = [
      { color: "#aaa", description: "AAAH" },
      { color: "#2b2b3b", description: "2B or not 2B" },
      { color: "blue", description: "Blue" },
      { color: "rgb(1, 2, 3)", description: "Basically black" },
    ];
    const rendered = shallow(<MapKey colors={colors} showLar={false} />);
    expect(rendered.find(Color)).toHaveLength(4);
    expect(rendered.find(Color).at(0).props()).toEqual({
      children: "AAAH",
      color: "#aaa",
      first: true,
    });
    expect(rendered.find(Color).at(3).props()).toEqual({
      children: "Basically black",
      color: "rgb(1, 2, 3)",
      first: false,
    });
  });

  it("includes three LoanCircles", () => {
    const rendered = shallow(<MapKey colors={[]} showLar={true} />);
    expect(rendered.find(LoanCircle)).toHaveLength(3);
    expect(rendered.find(LoanCircle).map(el => el.prop("percentile")))
      .toEqual([.5, .7, .9]);
  });

  it("will not show LoanCircles if not showLar", () => {
    const rendered = shallow(<MapKey colors={[]} showLar={false} />);
    expect(rendered.find(LoanCircle)).toHaveLength(0);
  });
});
