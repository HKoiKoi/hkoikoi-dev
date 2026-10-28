import { describe, expect, it } from "vitest";

import { activities } from "@/data/activities";
import { career } from "@/data/career";
import { certifications } from "@/data/certifications";
import { education } from "@/data/education";
import { languages } from "@/data/languages";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { publications } from "@/data/publications";
import { volunteer } from "@/data/volunteer";

const resumeSections = {
  activities,
  career,
  certifications,
  education,
  languages,
  volunteer,
};

const isBlank = (value: string | undefined) => !value || value.trim() === "";

describe.each(Object.entries(resumeSections))("%s", (_name, entries) => {
  it("항목이 하나 이상이다", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("title이 비어 있지 않고 중복되지 않는다", () => {
    const titles = entries.map((entry) => entry.title);
    expect(titles.every((title) => !isBlank(title))).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("선택 필드는 지정했다면 비어 있지 않다", () => {
    for (const entry of entries) {
      for (const key of [
        "subtitle",
        "period",
        "description",
        "link",
      ] as const) {
        if (entry[key] !== undefined) expect(isBlank(entry[key])).toBe(false);
      }
      if (entry.tags)
        expect(entry.tags.every((tag) => !isBlank(tag))).toBe(true);
    }
  });
});

describe("projects", () => {
  it("name이 중복되지 않는다", () => {
    const names = projects.map((project) => project.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("필수 필드가 채워져 있다", () => {
    for (const project of projects) {
      expect(isBlank(project.name)).toBe(false);
      expect(isBlank(project.summary)).toBe(false);
      expect(isBlank(project.period)).toBe(false);
      expect(isBlank(project.role)).toBe(false);
      expect(project.stack.length).toBeGreaterThan(0);
    }
  });

  it("링크는 http(s) URL이다", () => {
    for (const url of projects.flatMap((p) => Object.values(p.links))) {
      expect(url).toMatch(/^https?:\/\//);
    }
  });
});

describe("publications", () => {
  it("title이 중복되지 않는다", () => {
    const titles = publications.map((publication) => publication.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("필수 필드가 채워져 있고 year가 정수이며 link가 http(s)다", () => {
    for (const publication of publications) {
      expect(isBlank(publication.title)).toBe(false);
      expect(isBlank(publication.authors)).toBe(false);
      expect(isBlank(publication.venue)).toBe(false);
      expect(Number.isInteger(publication.year)).toBe(true);
      expect(publication.link).toMatch(/^https?:\/\//);
    }
  });
});

describe("profile", () => {
  it("필수 필드가 채워져 있다", () => {
    for (const key of ["name", "tagline", "bio", "email", "github"] as const) {
      expect(isBlank(profile[key])).toBe(false);
    }
  });

  it("이메일과 GitHub 주소 형식이 올바르다", () => {
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(profile.github).toMatch(/^https:\/\/github\.com\//);
  });
});
