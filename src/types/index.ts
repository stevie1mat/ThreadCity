export interface Post {
  uri: string;
  author: string;
  handle: string;
  text: string;
  likes: number;
  reposts: number;
  replies: number;
  depth: number;
  children: Post[];
}

export interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  floors: number;
  color: string;
  glowColor: string;
  post: Post;
  isOP: boolean;
  depth: number;
}

export interface Street {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  color: string;
  width: number;
  depth: number;
}

export interface City {
  buildings: Building[];
  streets: Street[];
}
