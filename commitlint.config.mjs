// 형식: `타입: 제목` 또는 `타입(scope): 제목` — 제목은 한국어 허용
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
  },
};

export default config;
