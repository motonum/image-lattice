import { render } from "@testing-library/react";
import Grid from "../Grid";

describe("Grid", () => {
	test("renders without crashing", () => {
		render(<Grid />);
	});
});
