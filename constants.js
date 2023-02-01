export const RESOURCES_DIR = process.env.WEBSITE_RESOURCES_DIR || "./resources";

export const TEMP_DIR = process.env.WEBSITE_TEMP_DIR || "./tmp";

export const PUBLIC_DIR = process.env.WEBSITE_PUBLIC_DIR || "./dist";

export const STATIC_DIR = process.env.WEBSITE_STATIC_DIR || "./static";

export const DEV = process.env.NODE_ENV === "development";

export const SCALE_STEP = 0.25;

export const SCALE_MAX = DEV ? 1.5 : 3;

export const DEFAULT_SCENE_NAME =
  process.env.WEBSITE_DEFAULT_SCENE_NAME || "Default";

export const SCENE_NAME_WHITELIST = process.env.WEBSITE_SCENE_NAME_WHITELIST
  ? process.env.WEBSITE_SCENE_NAME_WHITELIST.split(",")
  : [];
