import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import http from "node:http";
import serve from "serve-handler";
import sharp from "sharp";
import puppeteer from "puppeteer";
import esbuild from "esbuild";
import * as lightningcss from "lightningcss";
import { getScenes } from "./scenes.js";
import { html, css } from "./tags.js";
import {
  RESOURCES_DIR,
  DEV,
  TEMP_DIR,
  PUBLIC_DIR,
  SCALE_MAX,
  SCALE_STEP,
  DEFAULT_SCENE_NAME,
  STATIC_DIR,
} from "./constants.js";

/**
 * @typedef {import("./scenes.js").Scene} Scene
 */

const scales = Array.from(
  { length: (SCALE_MAX - 1) / SCALE_STEP + 1 },
  (_, k) => k * SCALE_STEP + 1
);

const styles = {
  /** @type {{css: string, index: number[]}[]} */
  styles: [],

  /**
   * @param {string} style
   * @param {number[]} [index] - Allows sorting independent of DOM
   */
  add(style, index = []) {
    this.styles.push({
      css: style,
      index,
    });
  },

  /**
   * @returns {Promise<string>}
   */
  async build() {
    /**
     * @param {number[]} a
     * @param {number[]} b
     * @returns {number}
     */
    function sortByIndexArr(a, b) {
      if (a[0] === undefined && b[0] === undefined) {
        return 0;
      } else if (a[0] === undefined) {
        return -1;
      } else if (b[0] === undefined) {
        return 1;
      } else if (a[0] === b[0]) {
        return sortByIndexArr(a.slice(1), b.slice(1));
      } else {
        return a[0] - b[0];
      }
    }

    const stylesString = this.styles
      .sort((a, b) => sortByIndexArr(a.index, b.index))
      .map(
        (style) => css`
          /* Index: ${JSON.stringify(style.index)} */
          ${style.css}
        `
      )
      .join("\n");

    return lightningcss
      .transform({
        filename: "styles",
        code: Buffer.from(stylesString),
        minify: !DEV,
      })
      .code.toString();
  },

  reset() {
    this.styles = [];
  },
};

const scripts = {
  /** @type {Object.<string, string>} */
  variables: {},

  /**
   * @param {string} name
   * @param {string} value
   */
  addVariable(name, value) {
    this.variables[name] = value;
  },

  /**
   * @returns {Promise<string>}
   */
  async build() {
    return await esbuild
      .build({
        entryPoints: ["./client.js"],
        bundle: true,
        write: false,
        minify: !DEV,
        define: this.variables,
      })
      .then((res) => res.outputFiles.map((f) => f.text).join("\n"));
  },

  reset() {
    this.variables = {};
  },
};

const classNames = {
  counter: 0,

  /**
   * @returns {string}
   */
  make() {
    const className = (this.counter++).toString(16);

    if (/^\D/.test(className)) {
      return className;
    } else {
      return this.make();
    }
  },

  reset() {
    this.counter = 0;
  },
};

/**
 * @returns {Promise<string>}
 */
async function Avatar() {
  const size = 144;

  const containerClassName = classNames.make();
  const className = classNames.make();

  styles.add(
    css`
      .${containerClassName} {
        display: flex;
        justify-content: center;
        margin-bottom: 34;
      }
    `
  );

  const imageBuffer = await sharp(path.join(RESOURCES_DIR, "avatar.png"))
    .resize({
      width: size * SCALE_MAX,
      height: size * SCALE_MAX,
    })
    .toBuffer();

  const imageHash = crypto
    .createHash("shake256", { outputLength: 4 })
    .update(imageBuffer)
    .digest("hex");

  const images = await Promise.all(
    scales.map(async (scale) => {
      const file = path.join(PUBLIC_DIR, `${imageHash}@${scale}x.webp`);
      await sharp(imageBuffer)
        .resize({
          width: size * scale,
          height: size * scale,
        })
        .webp({
          quality: 90,
          effort: DEV ? 4 : 6,
        })
        .toFile(file);

      return { file: path.relative(PUBLIC_DIR, file), scale };
    })
  );

  const defaultImage = images.find((image) => image.scale === 1);

  return html`<div class="${containerClassName}">
    <img
      class="${className}"
      alt="Adam"
      width="${size}"
      height="${size}"
      src="${defaultImage && defaultImage.file}"
      srcset="
        ${images.map((image) => `${image.file} ${image.scale}x`).join(", ")}
      "
    />
  </div>`;
}

/**
 * @returns {Promise<string[]>}
 */
async function Favicons() {
  const imageBuffer = await sharp(
    path.join(RESOURCES_DIR, "avatar.png")
  ).toBuffer();

  const imageHash = crypto
    .createHash("shake256", { outputLength: 4 })
    .update(imageBuffer)
    .digest("hex");

  return Promise.all(
    [16, 32].map(async (size) => {
      const file = path.join(PUBLIC_DIR, `${imageHash}@${size}.png`);
      await sharp(imageBuffer)
        .resize({
          width: size,
          height: size,
        })
        .png({
          quality: 90,
          effort: DEV ? 4 : 6,
        })
        .toFile(file);

      return html`<link
        rel="icon"
        type="image/png"
        sizes="${size}"
        href=${path.relative(PUBLIC_DIR, file)}
      />`;
    })
  );
}

/**
 * @returns {Promise<string>}
 */
async function Links() {
  const containerClassName = classNames.make();
  const className = classNames.make();

  styles.add(css`
    .${containerClassName} {
      display: flex;
      justify-content: center;
      margin: 34px 0;
    }

    .${className} {
      display: flex;
      align-items: center;
      height: 34px;
      padding: 0 13px;
      margin: 0 3px;
      border-radius: 8px;
      text-decoration: none;
      color: blue;
      background: rgba(255, 255, 255, 0);
      transition: background-color 250ms, color 250ms;
    }

    .${className}:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .${className} > span {
      text-decoration: none;
      line-height: 1;
    }

    .${className} > svg {
      margin-right: 5px;
    }
  `);

  return html`
    <div class="${containerClassName}">
      <a class="${className}" href="mailto:adam@adambubenicek.com">
        <?xml version="1.0" encoding="UTF-8"?><svg
          width="16px"
          height="16px"
          stroke-width="1.9"
          stroke="currentcolor"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 9l5 3.5L17 9"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
          <path
            d="M2 17V7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2z"
            stroke-width="1.9"
          ></path>
        </svg>
        <span>Email</span>
      </a>
      <a class="${className}" href="https://gitlab.com/adambubenicek">
        <?xml version="1.0" encoding="UTF-8"?><svg
          width="16px"
          height="16px"
          stroke-width="1.9"
          viewBox="0 0 24 24"
          stroke="currentcolor"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clip-rule="evenodd"
            d="M17.057 2.544a.2.2 0 01.378-.008l3.114 8.31 1.398 3.73a.2.2 0 01-.07.232l-9.76 7.106a.2.2 0 01-.235 0l-9.76-7.106a.2.2 0 01-.069-.231l1.398-3.73.167-.45 2.944-7.861a.2.2 0 01.378.008l2.47 7.6a.2.2 0 00.19.137h4.8a.2.2 0 00.19-.138l2.467-7.599z"
            stroke-width="1.9"
          ></path>
        </svg>
        <span>GitLab</span>
      </a>
    </div>
  `;
}

/**
 * @param {Object} props
 * @param {Scene} props.scene
 * @param {string} props.className
 * @returns {Promise<string[]>}
 */
async function Things(props) {
  return Promise.all(
    props.scene.things
      .sort((t1, t2) => t1.z - t2.z)
      .map(async (thing) => {
        const className = classNames.make();

        const imageHash = crypto
          .createHash("shake256", { outputLength: 4 })
          .update(await sharp(thing.render.file).toBuffer())
          .digest("hex");

        for (let scale of scales) {
          const file = path.join(PUBLIC_DIR, `${imageHash}@${scale}x.webp`);

          await sharp(thing.render.file)
            .resize({
              width: thing.width * scale,
              height: thing.height * scale,
            })
            .webp({
              quality: 90,
              effort: DEV ? 4 : 6,
            })
            .toFile(file);

          const mediaQuery =
            scale === SCALE_MAX
              ? "screen"
              : `screen and (max-resolution: ${(scale - SCALE_STEP) * 96}dpi)`;

          styles.add(
            css`
              @media ${mediaQuery} {
                .${className} {
                  background-image: url("${path.relative(PUBLIC_DIR, file)}");
                }
              }
            `,
            scale === SCALE_MAX ? [2] : [2, -scale]
          );
        }

        styles.add(
          css`
            .${className} {
              width: ${thing.width}px;
              height: ${thing.height}px;
              left: ${thing.x - props.scene.width / 2}px;
              top: ${thing.y - props.scene.height / 2}px;
              background-size: ${thing.width}px ${thing.height}px;
            }
          `
        );

        return html`<div
          class="${props.className} ${className}"
          data-z="${thing.z}"
        ></div>`;
      })
  );
}

/**
 * @param {Object} props
 * @param {Scene} props.scene
 * @param {string} props.className
 * @returns {Promise<string>}
 */
async function Background(props) {
  const { background } = props.scene;

  const className = classNames.make();

  const imageHash = crypto
    .createHash("shake256", { outputLength: 4 })
    .update(await sharp(background.render.file).toBuffer())
    .digest("hex");

  for (let scale of scales) {
    const file = path.join(PUBLIC_DIR, `${imageHash}@${scale}x.webp`);

    await sharp(background.render.file)
      .resize({
        width: background.width * scale,
        height: background.height * scale,
      })
      .webp({
        quality: 90,
        effort: DEV ? 4 : 6,
      })
      .toFile(file);

    const mediaQuery =
      scale === SCALE_MAX
        ? "screen"
        : `screen and (max-resolution: ${scale * 96}dpi)`;

    styles.add(
      css`
        @media ${mediaQuery} {
          .${className} {
            background-image: url("${path.relative(PUBLIC_DIR, file)}");
          }
        }
      `,
      scale === SCALE_MAX ? [2] : [2, -scale]
    );
  }

  styles.add(
    css`
      .${className} {
        width: ${background.width}px;
        height: ${background.height}px;
        left: ${background.x - props.scene.width / 2}px;
        top: ${background.y - props.scene.height / 2}px;
        background-size: ${background.width}px ${background.height}px;
      }
    `
  );

  return html`<div
    class="${props.className} ${className}"
    data-z="${background.z}"
  ></div>`;
}

/**
 * @returns {Promise<string[]>}
 */
async function Scenes() {
  const scenes = await getScenes();
  const className = classNames.make();
  const thingClassName = classNames.make();
  const backgroundClassName = classNames.make();

  scripts.addVariable("SCENE_SELECTOR", JSON.stringify(`.${className}`));
  scripts.addVariable(
    "OBJECT_SELECTOR",
    JSON.stringify(`.${backgroundClassName}, .${thingClassName}`)
  );

  styles.add(
    css`
      .${className} {
        display: none;
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: -1;
      }

      .${thingClassName}, .${backgroundClassName} {
        position: absolute;
      }
    `
  );

  return Promise.all(
    scenes
      .sort((scene1, scene2) => scene1.width - scene2.width)
      .map(async (scene) => {
        const sceneClassName = classNames.make();
        const parallaxAmount = Math.round(
          (scene.name === DEFAULT_SCENE_NAME ? scene.width / 2 : scene.width) /
            40
        );

        const mediaQuery =
          scene.name === DEFAULT_SCENE_NAME
            ? "screen"
            : `screen and (max-width: ${scene.width - parallaxAmount}px)`;

        styles.add(
          css`
            @media ${mediaQuery} {
              html {
                background-color: ${scene.background.color.css};
              }
              body {
                min-height: ${scene.height / 2 + parallaxAmount}px;
              }
              .${sceneClassName} {
                display: block;
              }
              .${sceneClassName} + .${className} {
                display: none;
              }
            }
          `,
          scene.name === DEFAULT_SCENE_NAME ? [1] : [1, -scene.width]
        );

        return html`<div
          class="${className} ${sceneClassName}"
          data-media-query="${mediaQuery}"
          data-parallax-amount="${parallaxAmount}"
        >
          ${await Background({ scene, className: backgroundClassName })}
          ${await Things({ scene, className: thingClassName })}
        </div>`;
      })
  );
}

/**
 * @param {Object} props
 * @param {boolean} [props.screenshotOnly]
 */
async function Website(props) {
  classNames.reset();
  scripts.reset();
  styles.reset();

  styles.add(
    css`
      html {
        overflow: scroll;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
          Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, sans-serif;
      }

      body {
        margin: 0;
        height: 100%;
        overflow: hidden;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      main {
        max-width: 360px;
        height: 440px;
        margin: 21px;
      }

      h1 {
        font-size: 26px;
        margin: 21px 0;
        line-height: 42px;
        text-align: center;
      }

      p {
        margin: 21px 0;
        line-height: 26px;
        font-size: 16px;
      }
    `
  );

  const avatar = await Avatar();
  const links = await Links();
  const favicons = await Favicons();
  const scenes = props.screenshotOnly ? "" : await Scenes();

  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Adam Bubeníček</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${favicons}
        <style>
          ${await styles.build()}
        </style>
      </head>
      <body>
        <main>
          ${avatar}
          <h1>Adam Bubeníček</h1>
          <p>
            Hi, I'm Adam. I live in Prague, I love dogs, and I'm pretty good at
            making websites, apps, and coffee.
          </p>
          <p>
            I also like to take photos on film, print 3D things, build weird
            keyboards, play&nbsp;games, and tinker with free and open-source
            software.
          </p>
          ${links}
        </main>
        ${scenes}
        <script type="text/javascript">
          ${props.screenshotOnly ? "" : await scripts.build()};
        </script>
      </body>
    </html>`;
}

await fs.mkdir(TEMP_DIR, { recursive: true });
await fs.cp(STATIC_DIR, PUBLIC_DIR, { recursive: true });

{
  await fs.writeFile(
    path.join(PUBLIC_DIR, "index.html"),
    await Website({
      screenshotOnly: true,
    })
  );

  const server = http.createServer((request, response) => {
    return serve(request, response, { public: PUBLIC_DIR });
  });

  server.listen(3001, async () => {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1024 });
    await page.goto("http://localhost:3001");
    await page.screenshot({
      path: path.join(RESOURCES_DIR, "screenshot.png"),
      omitBackground: true,
    });
    await browser.close();

    server.close();
  });
}

await fs.writeFile(path.join(PUBLIC_DIR, "index.html"), await Website({}));
