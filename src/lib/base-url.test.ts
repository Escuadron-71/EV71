import { afterEach, describe, expect, it } from "vitest";
import { getBase, resolvePath } from "./base-url";

const defaultBaseUrl = import.meta.env.BASE_URL;

afterEach(() => {
  import.meta.env.BASE_URL = defaultBaseUrl;
});

describe("getBase", () => {
  it("keeps a trailing slash base as-is", () => {
    import.meta.env.BASE_URL = "/";
    expect(getBase()).toBe("/");
  });

  it("appends a trailing slash when missing", () => {
    import.meta.env.BASE_URL = "/ev71";
    expect(getBase()).toBe("/ev71/");
  });
});

describe("resolvePath", () => {
  it("returns paths already under the base unchanged", () => {
    import.meta.env.BASE_URL = "/ev71/";
    expect(resolvePath("/ev71/operaciones")).toBe("/ev71/operaciones");
  });

  it("prefixes relative paths with the base", () => {
    import.meta.env.BASE_URL = "/ev71/";
    expect(resolvePath("operaciones")).toBe("/ev71/operaciones");
  });

  it("prefixes leading-slash paths with the base", () => {
    import.meta.env.BASE_URL = "/ev71/";
    expect(resolvePath("/operaciones")).toBe("/ev71/operaciones");
  });

  it("resolves paths under root base", () => {
    import.meta.env.BASE_URL = "/";
    expect(resolvePath("/operaciones")).toBe("/operaciones");
  });

  it("keeps external http(s) links untouched", () => {
    import.meta.env.BASE_URL = "/";
    expect(resolvePath("https://discord.com/events/1/2")).toBe(
      "https://discord.com/events/1/2",
    );
  });

  it("resolves hash anchors against the base", () => {
    import.meta.env.BASE_URL = "/ev71/";
    expect(resolvePath("#section")).toBe("/ev71#section");
  });
});
