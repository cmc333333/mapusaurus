import { resize, setupResize } from "../Window";

describe("setupResize()", () => {
  it("dispatches the correct action", () => {
    const window = {
      addEventListener: (evType, fn) => fn(), // call the fn immediately
      innerHeight: 123,
      innerWidth: 456,
      setTimeout: fn => fn(), // call the fn immediately
    };
    const store = { dispatch: jest.fn() };
    setupResize(window, store);
    expect(store.dispatch).toHaveBeenCalledWith(resize({
      height: 123,
      width: 456,
    }));
  });

  it("is triggered by a resize event", () => {
    const window = {
      addEventListener: jest.fn(),
      setTimeout: jest.fn(),
    };
    setupResize(window, {});
    expect(window.addEventListener).toHaveBeenCalled();
    expect(window.addEventListener.mock.calls[0][0]).toBe("resize");
    expect(window.setTimeout).not.toHaveBeenCalled();
    window.addEventListener.mock.calls[0][1]();
    expect(window.setTimeout).toHaveBeenCalled();
  });

  it("clears existing timeouts", () => {
    const window = {
      addEventListener: jest.fn(),
      clearTimeout: jest.fn(),
      setTimeout: () => "timeout-id",
    };
    setupResize(window, {});
    expect(window.clearTimeout).not.toHaveBeenCalled();

    window.addEventListener.mock.calls[0][1]();
    expect(window.clearTimeout).not.toHaveBeenCalled();

    window.addEventListener.mock.calls[0][1]();
    expect(window.clearTimeout).toHaveBeenCalledWith("timeout-id");
  });
});
