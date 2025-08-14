import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./i18n.js";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);