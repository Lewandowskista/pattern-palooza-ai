import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

class MockFileReader {
  public result: string | ArrayBuffer | null = null;

  public onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

  public onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsDataURL(file: Blob) {
    this.result = `data:${file.type || "image/png"};base64,mock-${file.size}`;
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
  }
}

Object.defineProperty(window, "FileReader", {
  writable: true,
  value: MockFileReader,
});

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

Object.defineProperty(window.URL, "createObjectURL", {
  writable: true,
  value: () => "blob:mock-url",
});

Object.defineProperty(window.URL, "revokeObjectURL", {
  writable: true,
  value: () => {},
});
