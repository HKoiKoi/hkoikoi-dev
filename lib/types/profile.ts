export type Profile = {
  name: string;
  tagline: string;
  bio: string;
  email: string;
  github: string;
  /** 아바타 이미지 경로(public/ 기준) 또는 URL. 없으면 이름 첫 글자를 표시한다. */
  avatar?: string;
};
