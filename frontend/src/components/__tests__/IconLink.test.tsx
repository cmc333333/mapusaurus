import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { shallow } from "enzyme";
import * as React from "react";

import IconLink from "../IconLink";

describe("<IconLink />", () => {
  it("includes tab's title", () => {
    const rendered = shallow(
      <IconLink icon={faChevronUp} onClick={jest.fn()} title="Some Title" />,
    );
    expect(rendered.prop("title")).toBe("Some Title");
  });

  it("includes tab's icon", () => {
    const rendered = shallow(
      <IconLink icon={faChevronUp} onClick={jest.fn()} title="Some Title" />,
    );
    expect(rendered.find("FontAwesomeIcon").prop("icon")).toEqual(faChevronUp);
  });

  it("can be clicked", () => {
    const onClick = jest.fn();
    const rendered = shallow(
      <IconLink icon={faChevronUp} onClick={onClick} title="Some Title" />,
    );
    const ev = { preventDefault: jest.fn() };
    rendered.simulate("click", ev);
    expect(ev.preventDefault).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
  });
});
