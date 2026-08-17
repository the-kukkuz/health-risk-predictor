import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";

// jsdom does not implement ResizeObserver (needed by Recharts ResponsiveContainer).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;
if (typeof (globalThis as any).DOMRect === "undefined") {
  (globalThis as any).DOMRect = class {
    x = 0; y = 0; width = 0; height = 0;
  };
}

// Render `ui` inside a <Route path="/predict/:disease"> so useParams() works.
export function renderWithRouter(
  ui: ReactElement,
  route = "/predict/diabetes"
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/predict/:disease" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}
