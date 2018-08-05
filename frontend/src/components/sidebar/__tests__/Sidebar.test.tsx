import { shallow } from "enzyme";
import * as React from "react";

import { Sidebar } from "../Sidebar";
import TabLink from "../TabLink";

describe("<Sidebar />", () => {
  it("contains three tabs", () => {
    const tabs = shallow(<Sidebar size={100}><div /></Sidebar>).find(TabLink);
    expect(tabs).toHaveLength(3);
    expect(tabs.map(t => t.prop("tab"))).toEqual(["layers", "features", "lar"]);
    expect(tabs.at(0).prop("icon")).not.toEqual(tabs.at(1).prop("icon"));
    expect(tabs.at(0).prop("icon")).not.toEqual(tabs.at(2).prop("icon"));
    expect(tabs.at(1).prop("icon")).not.toEqual(tabs.at(2).prop("icon"));
  });

  it("calculates sizes", () => {
    const rendered = shallow(<Sidebar size={101}><div /></Sidebar>);
    expect(rendered.prop("width")).toBe("101px");
    const tabs = rendered.find(TabLink);
    tabs.forEach(t => expect(t.prop("size")).toBe(33));
  });
});
