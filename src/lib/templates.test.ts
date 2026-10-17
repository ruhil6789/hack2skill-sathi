import { describe, expect, it } from "vitest";
import { defaultTemplates } from "./templates";

describe("defaultTemplates", () => {
  it("builds grievance, leave, and customer templates with worker name", () => {
    const tpls = defaultTemplates({
      name: "Ravi",
      language: "hi",
      jobType: "delivery",
      city: "Chandigarh",
      platform: "Swiggy",
    });
    expect(tpls).toHaveLength(3);
    expect(tpls.map((t) => t.kind).sort()).toEqual([
      "customer",
      "grievance",
      "leave",
    ]);
    expect(tpls[0].body).toContain("Ravi");
    expect(tpls[0].body).toContain("Swiggy");
  });
});
