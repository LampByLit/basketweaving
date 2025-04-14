export interface Board {
  board: string;
  title: string;
  ws_board: number;
  per_page: number;
  pages: number;
  max_filesize: number;
  max_webm_filesize: number;
  max_comment_chars: number;
  max_webm_duration: number;
  bump_limit: number;
  image_limit: number;
  cooldowns: {
    threads: number;
    replies: number;
    images: number;
  };
  meta_description: string;
  spoilers?: number;
  custom_spoilers?: number;
  is_archived?: number;
  board_flags?: { [key: string]: string };
  country_flags?: number;
  user_ids?: number;
  oekaki?: number;
  sjis_tags?: number;
  code_tags?: number;
  math_tags?: number;
  text_only?: number;
  forced_anon?: number;
  webm_audio?: number;
  require_subject?: number;
  min_image_width?: number;
  min_image_height?: number;
}

export interface Post {
  no: number;
  resto: number;
  sticky?: number;
  closed?: number;
  now: string;
  time: number;
  name: string;
  trip?: string;
  id?: string;
  capcode?: string;
  country?: string;
  country_name?: string;
  board_flag?: string;
  flag_name?: string;
  sub?: string;
  com?: string;
  tim?: number;
  filename?: string;
  ext?: string;
  fsize?: number;
  md5?: string;
  w?: number;
  h?: number;
  tn_w?: number;
  tn_h?: number;
  filedeleted?: number;
  spoiler?: number;
  custom_spoiler?: number;
  replies?: number;
  images?: number;
  bumplimit?: number;
  imagelimit?: number;
  tag?: string;
  semantic_url?: string;
  since4pass?: number;
  unique_ips?: number;
  m_img?: number;
  last_modified?: number;
  last_replies?: Post[];
  archived?: number;
  archived_on?: number;
}

export interface Thread {
  no: number;
  last_modified: number;
  replies: number;
  images: number;
  posts: Post[];
}

export interface Catalog {
  page: number;
  threads: Thread[];
}

export interface GetType {
  type: "dubs" | "trips" | "quads" | "quints";
  pattern: RegExp;
  previous: RegExp;
}

export interface PostConfig {
  board: string;
  name?: string;
  subject?: string;
  comment: string;
  file?: File;
  getType: GetType;
} 