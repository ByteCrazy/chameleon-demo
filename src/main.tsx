import ReactDOMClient from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./index.css";

ReactDOMClient.createRoot(document.getElementById("root") as HTMLElement).render(<RouterProvider router={router} />);
