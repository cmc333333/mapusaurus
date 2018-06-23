import { shallow } from "enzyme";
import * as React from "react";

import { ChoroplethSelection } from "../ChoroplethSelection";

describe("<ChoroplethSelection />", () => {
  it("creates a link per choropleth", () => {
    const choropleths = [
      { id: "aaa", name: "AAA" },
      { id: "bbb", name: "BBB" },
      { id: "ccc", name: "CCC" },
    ];
    const links = shallow(<ChoroplethSelection choropleths={choropleths} />)
      .find("Connect(ChoroplethLink)");

    expect(links.at(0).prop("layer")).toEqual(choropleths[0]);
    expect(links.at(1).prop("layer")).toEqual(choropleths[1]);
    expect(links.at(2).prop("layer")).toEqual(choropleths[2]);
  });
});
