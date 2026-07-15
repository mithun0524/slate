import ReactDOM from "react-dom/client";
import App from "./App";

// NOTE: intentionally not wrapped in <React.StrictMode> — its double-invoked
// effects would spawn the pty twice in dev.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
);
