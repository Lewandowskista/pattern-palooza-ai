import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UploadPage from "@/pages/UploadPage";
import EditorPage from "@/pages/EditorPage";

const mockPatternResponse = {
  name: "Generated Satchel",
  pieces: [
    {
      id: "front_panel",
      label: "Front Panel",
      path: "M 0 0 L 50 0 L 50 50 L 0 50",
      width: 50,
      height: 50,
    },
  ],
  estimatedMaterial: { width: 60, length: 80, unit: "cm" },
};

describe("UploadPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    import.meta.env.VITE_SUPABASE_URL = undefined;
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = undefined;
  });

  it("shows an inline validation error when no images are provided", async () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /generate pattern from 0 images/i }));

    expect(
      await screen.findByText(/add at least one reference image before generating a pattern/i),
    ).toBeInTheDocument();
  });

  it("falls back to the demo pattern when Supabase env vars are missing", async () => {
    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["demo"], "bag.png", { type: "image/png" })],
      },
    });

    fireEvent.click(await screen.findByRole("button", { name: /generate pattern from 1 image/i }));

    expect(await screen.findByText("Sample Object Pattern")).toBeInTheDocument();
  });

  it("completes the generate to editor flow with a validated API response", async () => {
    import.meta.env.VITE_SUPABASE_URL = "https://example.supabase.co";
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "public-anon-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPatternResponse,
      }),
    );

    render(
      <MemoryRouter initialEntries={["/upload"]}>
        <Routes>
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["demo"], "satchel.png", { type: "image/png" })],
      },
    });

    fireEvent.click(await screen.findByRole("button", { name: /generate pattern from 1 image/i }));

    await waitFor(() => {
      expect(screen.getByText("Generated Satchel")).toBeInTheDocument();
    });
  });
});
