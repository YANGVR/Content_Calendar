import { describe, expect, it } from "vitest";

import { isValidUsername, normalizeUsername, toAuthEmail } from "./username";

describe("username", () => {
  it("앞뒤 공백을 지우고 소문자로 바꾼다", () => {
    expect(normalizeUsername("  Movie_Fan ")).toBe("movie_fan");
  });

  it("영문 소문자·숫자·밑줄 3–20자만 허용한다", () => {
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("a_1234567890123456789")).toBe(false);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("한글아이디")).toBe(false);
    expect(isValidUsername("with-dash")).toBe(false);
  });

  it("아이디를 내부 로그인용 이메일로 바꾼다", () => {
    expect(toAuthEmail("movie_fan")).toMatch(/^movie_fan@/);
  });
});
