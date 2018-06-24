import { shallow } from "enzyme";
import * as React from "react";

import { FeatureSelection } from "../FeatureSelection";

describe("<FeatureSelection />", () => {
  it("creates a link per feature", () => {
    const features = [
      { name: "AAA", ids: ["aaa", "bbb"] },
      { name: "BBB", ids: ["111", "222"] },
    ];
    const links = shallow(<FeatureSelection features={features} />)
      .find("Connect(FeatureCheckbox)");

    expect(links.at(0).prop("feature")).toEqual(features[0]);
    expect(links.at(1).prop("feature")).toEqual(features[1]);
    expect(links.at(2).prop("feature")).toEqual(features[2]);
  });
});
