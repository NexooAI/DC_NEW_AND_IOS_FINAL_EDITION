import React from "react";
import { render } from "@testing-library/react-native";
import { FlashNewsV2 } from "../../components/homeV2/FlashNewsV2";

describe("FlashNewsV2 Component", () => {
  it("renders null when messages array is empty", () => {
    const { toJSON } = render(<FlashNewsV2 messages={[]} />);
    expect(toJSON()).toBeNull();
  });

  it("renders marquee ticker with message text when messages exist", () => {
    const messages = ["Special Gold Savings Festival - Zero Wastage!"];
    const { getByText } = render(<FlashNewsV2 messages={messages} />);

    expect(getByText("FLASH NEWS")).toBeTruthy();
    expect(getByText("Special Gold Savings Festival - Zero Wastage!")).toBeTruthy();
  });

  it("displays counter pill when multiple messages are provided", () => {
    const messages = ["News 1", "News 2", "News 3"];
    const { getByText } = render(<FlashNewsV2 messages={messages} />);

    expect(getByText("1/3")).toBeTruthy();
  });
});
