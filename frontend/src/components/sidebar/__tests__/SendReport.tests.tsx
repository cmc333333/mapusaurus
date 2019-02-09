import { shallow } from "enzyme";
import glamorous from "glamorous";
import * as React from "react";

import { SendReport } from "../SendReport";

const buttonSelect = 'input[type="button"]';

describe("<SendReport />", () => {
  it("includes some text if sent", () => {
    const result = shallow(
      <SendReport
        handleSendClick={jest.fn()}
        handleTextChange={jest.fn()}
        reportEmail=""
        reportSent={true}
      />,
    );
    expect(result.text()).toContain("You should receive an email shortly!");
    expect(result.find(buttonSelect)).toHaveLength(0);
  });
  it("includes a button if not sent", () => {
    const result = shallow(
      <SendReport
        handleSendClick={jest.fn()}
        handleTextChange={jest.fn()}
        reportEmail=""
        reportSent={false}
      />,
    );
    expect(result.text()).not.toContain("You should receive an email shortly!");
    expect(result.find(buttonSelect)).toHaveLength(1);
  });

  it("includes email", () => {
    const result = shallow(
      <SendReport
        handleSendClick={jest.fn()}
        handleTextChange={jest.fn()}
        reportEmail="someone@ex"
        reportSent={false}
      />,
    );
    expect(result.find(glamorous.Input).prop("value")).toBe("someone@ex");
  });

  it("handles events", () => {
    const handleSendClick = jest.fn();
    const handleTextChange = jest.fn();
    const result = shallow(
      <SendReport
        handleSendClick={handleSendClick}
        handleTextChange={handleTextChange}
        reportEmail=""
        reportSent={false}
      />,
    );
    result.find(glamorous.Input).simulate("change", { an: "event" });
    expect(handleTextChange).toHaveBeenCalledWith({ an: "event" });
    result.find(buttonSelect).simulate("click", { another: "event" });
    expect(handleSendClick).toHaveBeenCalledWith({ another: "event" });
  });
});
