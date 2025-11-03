import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { Toaster } from "./components/ui/sonner";

const rootElement = document.getElementById("root");
if (rootElement) {
	createRoot(rootElement).render(
		<React.StrictMode>
			<App />
			<Toaster />
		</React.StrictMode>,
	);
}
