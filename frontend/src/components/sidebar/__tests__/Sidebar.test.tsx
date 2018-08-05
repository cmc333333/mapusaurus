import { shallow } from "enzyme";
import * as React from "react";

import tabs from "../../../tabs";
import { Sidebar } from "../Sidebar";
import TabLink from "../TabLink";

describe("<Sidebar />", () => {
  it("contains links for each tab", () => {
    const links = shallow(
      <Sidebar activeTab={tabs[0]} size={100} />,
    ).find(TabLink);
    expect(links.map(l => l.prop("tab"))).toEqual(tabs);
  });

  it("calculates sizes", () => {
    const rendered = shallow(<Sidebar activeTab={tabs[0]} size={101} />);
    expect(rendered.prop("width")).toBe("101px");
    const links = rendered.find(TabLink);
    links.forEach(l => expect(l.prop("size")).toBe(33));
  });

  it("includes the active tab's content", () => {
    const rendered = shallow(<Sidebar activeTab={tabs[1]} size={100} />);
    expect(rendered.find(tabs[0].Component)).toHaveLength(0);
    expect(rendered.find(tabs[1].Component)).toHaveLength(1);
  });
});
