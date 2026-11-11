import { z } from "zod";

import {
  formString,
  optionalHttpsUrl,
  requiredText,
  text,
} from "@/lib/schemas/fields";

// DB check 제약과 같은 한도
export const PUBLICATION_LIMITS = {
  title: 500,
  authors: 500,
  venue: 500,
  yearMin: 1900,
  yearMax: 2100,
  link: 500,
} as const;

export const publicationSchema = z.object({
  title: requiredText("제목", PUBLICATION_LIMITS.title),
  authors: text("저자", PUBLICATION_LIMITS.authors),
  venue: text("게재처", PUBLICATION_LIMITS.venue),
  year: z
    .number({ error: "연도를 숫자로 입력해 주세요." })
    .int({ error: "연도를 숫자로 입력해 주세요." })
    .min(PUBLICATION_LIMITS.yearMin, {
      error: `연도는 ${PUBLICATION_LIMITS.yearMin}년 이후로 입력해 주세요.`,
    })
    .max(PUBLICATION_LIMITS.yearMax, {
      error: `연도는 ${PUBLICATION_LIMITS.yearMax}년 이전으로 입력해 주세요.`,
    }),
  link: optionalHttpsUrl("링크", PUBLICATION_LIMITS.link),
});

export type PublicationInput = z.output<typeof publicationSchema>;

/** FormData를 publicationSchema 입력 객체로 바꾼다. 숫자가 아닌 연도는 NaN이 되어 거부된다. */
export function parsePublicationFormData(formData: FormData) {
  const year = formString(formData, "year").trim();
  return {
    title: formString(formData, "title"),
    authors: formString(formData, "authors"),
    venue: formString(formData, "venue"),
    year: /^\d+$/.test(year) ? Number(year) : Number.NaN,
    link: formString(formData, "link"),
  };
}
