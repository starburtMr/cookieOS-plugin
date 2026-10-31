import { describe, expect, it } from "vitest";
import Serialize from "./index";

it("keeps prototype-named properties as data without changing Object.prototype", () => {
    const key = "ctoolFixturePolluted";
    expect(Object.hasOwn(Object.prototype,key)).toBe(false);
    try {
        const value = Serialize.formProperties(`a=x\na.__proto__.${key}=sentinel`,{convertToJsonTree:true});
        expect(value.isError()).toBe(false);
        expect(Object.hasOwn(Object.prototype,key)).toBe(false);
        expect(JSON.parse(value.toJson()).a.__proto__[key]).toBe("sentinel");
    } finally {delete (Object.prototype as Record<string,unknown>)[key];}
});

describe("helper/serialize", () => {
    it("formText should split multiline text into array items", () => {
        const result = Serialize.formText("alpha\nbeta\n\n gamma ");
        expect(result.isError()).toBe(false);
        expect(result.content()).toEqual(["alpha", "beta", "gamma"]);
    });

    it("json fallback should support pure Chinese multiline text when converting to text", () => {
        const result = Serialize.formJson("你好\n世界");
        expect(result.isError()).toBe(false);
        expect(result.content()).toEqual(["你好", "世界"]);
        expect(result.toText()).toBe("你好,\n世界");
    });
});
