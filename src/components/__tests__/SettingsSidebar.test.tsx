import { render } from "@testing-library/react";
import SettingsSidebar from "../SettingsSidebar";
import { SidebarProvider } from "../ui/sidebar";

describe("SettingsSidebar", () => {
	test("クラッシュせずにレンダリングされる", () => {
		render(
			<SidebarProvider>
				<SettingsSidebar />
			</SidebarProvider>,
		);
	});

	test("デフォルトのプロパティでレンダリングされる", () => {
		const { getByText } = render(
			<SidebarProvider>
				<SettingsSidebar />
			</SidebarProvider>,
		);
		expect(getByText("Settings"));
	});
});
