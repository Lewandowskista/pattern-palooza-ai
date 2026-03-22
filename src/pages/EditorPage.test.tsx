import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import EditorPage from "@/pages/EditorPage";

describe("EditorPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows a recoverable empty state when no pattern is available", () => {
    render(
      <MemoryRouter initialEntries={["/editor"]}>
        <Routes>
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("No pattern loaded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Upload" })).toBeInTheDocument();
  });
});
