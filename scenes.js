import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import child_process from "node:child_process";
import url from "node:url";
import sharp from "sharp";
import { html } from "./tags.js";
import {
  RESOURCES_DIR,
  TEMP_DIR,
  SCALE_STEP,
  SCALE_MAX,
  DEV,
  DEFAULT_SCENE_NAME,
  SCENE_NAME_WHITELIST,
} from "./constants.js";

/**
 * @typedef SceneRender
 * @property {string} file
 * @property {number} scale
 * @property {number} x
 * @property {number} y

 * @typedef Scene
 * @property {string} name
 * @property {number} width
 * @property {number} height
 * @property {Object} background
 * @property {Object} background.color
 * @property {String} background.color.css
 * @property {SceneRender} background.color.render
 * @property {string} background.color
 * @property {number} background.width
 * @property {number} background.height
 * @property {number} background.x
 * @property {number} background.y
 * @property {number} background.z
 * @property {SceneRender} background.render
 * @property {Object[]} things
 * @property {string} things[].name
 * @property {number} things[].width
 * @property {number} things[].height
 * @property {number} things[].x
 * @property {number} things[].y
 * @property {number} things[].z
 * @property {SceneRender} things[].render
 */

/**
 * @param {Object} props
 * @param {Object} props.things
 * @param {number} props.things.samples
 * @param {number} props.things.scale
 
 * @param {Object} props.background
 * @param {number} props.background.samples
 * @param {number} props.background.scale
 
 * @param {Object} props.background.color
 * @param {number} props.background.color.samples
 * @param {number} props.background.color.scale

 * @param {Scene[]} [props.scenes]
 * @returns {Promise<Scene[]>}
 */
async function render(props) {
  const fileHash = crypto
    .createHash("shake256", { outputLength: 4 })
    .update(JSON.stringify(props))
    .digest("hex");

  const file = path.join(TEMP_DIR, `scenes_${fileHash}.json`);

  const scriptFile = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "scenes.py"
  );

  const args = [
    path.resolve(RESOURCES_DIR, "scenes.blend"),
    "--background",
    "--python-exit-code",
    "1",
    "--python",
    scriptFile,
    `--`,
    `${JSON.stringify({
      ...props,
      sceneNameWhitelist: SCENE_NAME_WHITELIST,
      file,
    })}`,
  ];

  return new Promise((resolve, reject) => {
    const handleSigint = () => {
      blenderProcess.kill("SIGINT");
      process.exit();
    };

    process.on("SIGINT", handleSigint);

    const blenderProcess = child_process.spawn("blender", args);

    let stdout = "";

    blenderProcess.stdout.on("data", (data) => {
      stdout = (stdout + data.toString()).slice(-1000);
    });

    blenderProcess.on("close", (code) => {
      process.off("SIGINT", handleSigint);

      if (code !== 0) {
        console.log(stdout);
        return reject(stdout);
      }

      return resolve(fs.readFile(file, "utf-8").then(JSON.parse));
    });
  });
}

/**
 * @param {Scene} scene
 * @returns {Promise<Scene>}
 */
async function getBackgroundColorCSS(scene) {
  const buffer = await sharp(scene.background.color.render.file)
    .removeAlpha()
    .resize(3, 3)
    .raw()
    .toBuffer();

  const color = "rgb(" + [buffer[12], buffer[13], buffer[14]].join(", ") + ")";

  return {
    ...scene,
    background: {
      ...scene.background,
      color: {
        ...scene.background.color,
        css: color,
      },
    },
  };
}

/**
 * @param {Scene} scene
 * @returns {Promise<Scene>}
 */
async function trimThings(scene) {
  return {
    ...scene,
    things: await Promise.all(
      scene.things.map(async (thing) => {
        const { info } = await sharp(thing.render.file)
          .trim({ threshold: 1 })
          .toBuffer({ resolveWithObject: true });

        const trimWidth = info.width / thing.render.scale;
        const trimHeight = info.height / thing.render.scale;
        const trimX = -(info.trimOffsetLeft || -0) / thing.render.scale;
        const trimY = -(info.trimOffsetTop || -0) / thing.render.scale;

        const x1 = Math.max(
          0,
          Math.floor(trimX * SCALE_STEP - SCALE_STEP) / SCALE_STEP
        );
        const y1 = Math.max(
          0,
          Math.floor(trimY * SCALE_STEP - SCALE_STEP) / SCALE_STEP
        );
        const x2 = Math.min(
          scene.width,
          Math.ceil((trimX + trimWidth) * SCALE_STEP + SCALE_STEP) / SCALE_STEP
        );
        const y2 = Math.min(
          scene.height,
          Math.ceil((trimY + trimHeight) * SCALE_STEP + SCALE_STEP) / SCALE_STEP
        );

        return {
          ...thing,
          width: x2 - x1,
          height: y2 - y1,
          x: x1,
          y: y1,
          render: {
            ...thing.render,
            x: x1,
            y: y1,
          },
        };
      })
    ),
  };
}

/**
 * @param {Scene} scene
 * @returns {Promise<Scene>}
 */
async function cropThings(scene) {
  return {
    ...scene,
    things: await Promise.all(
      scene.things.map(async (thing) => {
        const file = thing.render.file.replace(/\.png$/, "_cropped.png");

        await sharp(thing.render.file)
          .extract({
            left: thing.x * thing.render.scale,
            top: thing.y * thing.render.scale,
            width: thing.width * thing.render.scale,
            height: thing.height * thing.render.scale,
          })
          .toFile(file);

        return {
          ...thing,
          render: {
            ...thing.render,
            file,
            x: 0,
            y: 0,
          },
        };
      })
    ),
  };
}

/**
 * @param {Scene} scene
 * @returns {Promise<Scene>}
 */
async function trimBackground(scene) {
  const { info } = await sharp(scene.background.render.file)
    .trim({ threshold: 1, background: scene.background.color.css })
    .toBuffer({ resolveWithObject: true });

  const trimWidth = info.width / scene.background.render.scale;
  const trimHeight = info.height / scene.background.render.scale;
  const trimX = -(info.trimOffsetLeft || -0) / scene.background.render.scale;
  const trimY = -(info.trimOffsetTop || -0) / scene.background.render.scale;

  const x1 = Math.max(
    0,
    Math.floor(trimX * SCALE_STEP - SCALE_STEP) / SCALE_STEP
  );
  const y1 = Math.max(
    0,
    Math.floor(trimY * SCALE_STEP - SCALE_STEP) / SCALE_STEP
  );
  const x2 = Math.min(
    scene.width,
    Math.ceil((trimX + trimWidth) * SCALE_STEP + SCALE_STEP) / SCALE_STEP
  );
  const y2 = Math.min(
    scene.height,
    Math.ceil((trimY + trimHeight) * SCALE_STEP + SCALE_STEP) / SCALE_STEP
  );

  return {
    ...scene,
    background: {
      ...scene.background,
      width: x2 - x1,
      height: y2 - y1,
      x: x1,
      y: y1,
      render: {
        ...scene.background.render,
        x: x1,
        y: y1,
      },
    },
  };
}

/**
 * @param {Scene} scene
 * @returns {Promise<Scene>}
 */
async function cropBackground(scene) {
  const file = scene.background.render.file.replace(/\.png$/, "_cropped.png");

  await sharp(scene.background.render.file)
    .extract({
      left: scene.background.x * scene.background.render.scale,
      top: scene.background.y * scene.background.render.scale,
      width: scene.background.width * scene.background.render.scale,
      height: scene.background.height * scene.background.render.scale,
    })
    .toFile(file);

  return {
    ...scene,
    background: {
      ...scene.background,
      render: {
        ...scene.background.render,
        file,
        x: 0,
        y: 0,
      },
    },
  };
}

/**
 * @param {Scene} scene
 * @returns {Promise<Scene>}
 */
async function fadeBackground(scene) {
  const file = scene.background.render.file.replace(/\.png$/, "_faded.png");
  const fadeFile = scene.background.render.file.replace(/\.png$/, "_fade.png");

  const fadeHorizontally = scene.name === DEFAULT_SCENE_NAME;

  const svg = html`<svg
    width="${scene.width * scene.background.render.scale}"
    height="${scene.height * scene.background.render.scale}"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="x" x1="0" x2="1" y1="0" y2="0">
        <stop stop-opacity="${fadeHorizontally ? 1 : 0}" offset="0" />
        <stop stop-opacity="0" offset="${1 / 4}" />
        <stop stop-opacity="0" offset="${3 / 4}" />
        <stop stop-opacity="${fadeHorizontally ? 1 : 0}" offset="1" />
      </linearGradient>
      <linearGradient id="y" x1="0" x2="0" y1="0" y2="1">
        <stop stop-opacity="1" offset="0" />
        <stop stop-opacity="0" offset="${1 / 4}" />
        <stop stop-opacity="0" offset="${3 / 4}" />
        <stop stop-opacity="1" offset="1" />
      </linearGradient>
    </defs>
    <rect
      x="0"
      y="0"
      width="${scene.width * scene.background.render.scale}"
      height="${scene.height * scene.background.render.scale}"
      fill="white"
    />
    <rect
      x="0"
      y="0"
      width="${scene.width * scene.background.render.scale}"
      height="${scene.height * scene.background.render.scale}"
      fill="url(#x)"
    />
    <rect
      x="0"
      y="0"
      width="${scene.width * scene.background.render.scale}"
      height="${scene.height * scene.background.render.scale}"
      fill="url(#y)"
    />
  </svg>`;

  await sharp({
    create: {
      width: scene.width * scene.background.render.scale,
      height: scene.height * scene.background.render.scale,
      channels: 3,
      background: "white",
      noise: {
        type: "gaussian",
        mean: 128,
        sigma: 8,
      },
    },
  })
    .composite([
      {
        input: await sharp(Buffer.from(svg))
          .blur(32 * scene.background.render.scale)
          .toBuffer(),
        blend: "hard-light",
      },
    ])
    .toColorspace("b-w")
    .toFile(fadeFile);

  await sharp(scene.background.render.file)
    .removeAlpha()
    .toBuffer()
    .then((buffer) => {
      return sharp(buffer).joinChannel(fadeFile).toBuffer();
    })
    .then((buffer) => {
      return sharp(buffer)
        .flatten({ background: scene.background.color.css })
        .toFile(file);
    });

  return {
    ...scene,
    background: {
      ...scene.background,
      render: {
        ...scene.background.render,
        file,
      },
    },
  };
}

/**
 * @returns {Promise<Scene[]>}
 */
export async function getScenes() {
  const env = DEV ? "dev" : "prod";
  const file = path.join(TEMP_DIR, `scenes_${SCALE_STEP}_${env}.json`);

  const scenes = await fs
    .readFile(file, "utf-8")
    .then(JSON.parse)
    .catch(() =>
      render({
        things: {
          samples: 16,
          scale: SCALE_STEP,
        },
        background: {
          samples: 32,
          scale: SCALE_STEP,
          color: {
            samples: 256,
            scale: 0.25,
          },
        },
      })
        .then((scenes) => Promise.all(scenes.map(getBackgroundColorCSS)))
        .then((scenes) => Promise.all(scenes.map(fadeBackground)))
        .then((scenes) => Promise.all(scenes.map(trimBackground)))
        .then((scenes) => Promise.all(scenes.map(trimThings)))
        .then((scenes) =>
          render({
            things: {
              samples: Math.round((DEV ? 128 : 4096) / SCALE_MAX ** 2),
              scale: SCALE_MAX,
            },
            background: {
              samples: Math.round((DEV ? 32 : 128) / SCALE_MAX ** 2),
              scale: SCALE_MAX,
              color: {
                samples: 256,
                scale: 0.25,
              },
            },
            scenes,
          })
        )
        .then((scenes) => Promise.all(scenes.map(fadeBackground)))
        .then((scenes) => Promise.all(scenes.map(cropBackground)))
        .then((scenes) => Promise.all(scenes.map(cropThings)))
    );

  await fs.writeFile(file, JSON.stringify(scenes));

  return scenes;
}
