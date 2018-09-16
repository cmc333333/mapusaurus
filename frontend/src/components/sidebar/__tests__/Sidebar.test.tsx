import { shallow } from "enzyme";
import * as React from "react";

import tabs from "../../../tabs";
import Expander from "../Expander";
import { Sidebar } from "../Sidebar";
import TabLink from "../TabLink";

describe("<Sidebar />", () => {
  it("contains links for each tab", () => {
    const links = shallow(
      <Sidebar activeTab={tabs[0]} expanded={true} />,
    ).find(TabLink);
    expect(links.map(l => l.prop("tab"))).toEqual(tabs);
  });

  it("includes the active tab's content", () => {
    const rendered = shallow(<Sidebar activeTab={tabs[1]} expanded={true} />);
    expect(rendered.find(tabs[0].Component as any)).toHaveLength(0);
    expect(rendered.find(tabs[1].Component as any)).toHaveLength(1);
  });

  it("includes an Expander component", () => {
    const expander = shallow(
      <Sidebar activeTab={tabs[0]} expanded={true} />,
    ).find(Expander);
    expect(expander).toHaveLength(1);
  });
});
