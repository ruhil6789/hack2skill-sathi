import { describe, expect, it } from "vitest";
import { cleanReplyText } from "./format";

describe("cleanReplyText", () => {
  it("strips bold markdown markers", () => {
    expect(cleanReplyText("Use **e-SHRAM** today")).toBe("Use e-SHRAM today");
  });

  it("strips headings and list markers", () => {
    expect(cleanReplyText("## Tips\n- Wear a helmet")).toBe("Tips\n• Wear a helmet");
  });

  it("strips links to plain labels", () => {
    expect(cleanReplyText("See [portal](https://example.com)")).toBe("See portal");
  });

  it("collapses excess blank lines", () => {
    expect(cleanReplyText("A\n\n\n\nB")).toBe("A\n\nB");
  });

  it("leaves Hindi plain text untouched", () => {
    expect(cleanReplyText("नमस्ते रात की डिलीवरी सुरक्षित रखें")).toBe(
      "नमस्ते रात की डिलीवरी सुरक्षित रखें",
    );
  });

  it("handles empty input", () => {
    expect(cleanReplyText("")).toBe("");
    expect(cleanReplyText("   ")).toBe("");
  });
});

