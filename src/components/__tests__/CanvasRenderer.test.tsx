import { render } from "@testing-library/react";
import CanvasRenderer from "../CanvasRenderer";

describe("CanvasRenderer", () => {
  test("renders without crashing", () => {
    render(<CanvasRenderer />);
  });
});