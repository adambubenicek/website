// @ts-ignore
const sceneSelector = SCENE_SELECTOR;

// @ts-ignore
const objectSelector = OBJECT_SELECTOR;

/**
 * @typedef  ClientScene
 * @property {string} mediaQuery
 * @property {MediaQueryList} mediaQueryList
 * @property {number} parallaxAmount
 * @property {Object[]} objects
 * @property {HTMLElement} objects[].element
 * @property {number} objects[].z
 */

/**
 * @returns {ClientScene}
 */
function getCurrentScene() {
  /** @type {ClientScene|null} */
  let newScene = null;

  for (let scene of scenes) {
    if (scene.mediaQueryList.matches) {
      newScene = scene;
    }
  }

  if (!newScene) {
    throw new Error("No scene matched.");
  }

  return newScene;
}

const scenes = Array.from(
  /** @type {NodeListOf<HTMLElement>} */ (
    document.body.querySelectorAll(sceneSelector)
  )
)
  .map((sceneElement) => {
    const mediaQuery = /** @type {string} */ (sceneElement.dataset.mediaQuery);
    const mediaQueryList = window.matchMedia(mediaQuery);
    const parallaxAmountString = /** @type {string} */ (
      sceneElement.dataset.parallaxAmount
    );

    mediaQueryList.addEventListener("change", () => {
      currentScene = getCurrentScene();
    });

    const objects = Array.from(
      /** @type {NodeListOf<HTMLElement>}*/ (
        sceneElement.querySelectorAll(objectSelector)
      )
    ).map((sceneObjectElement) => {
      const zString = /** @type {string} */ (sceneObjectElement.dataset.z);

      return {
        element: sceneObjectElement,
        x: 0,
        y: 0,
        z: parseFloat(zString),
      };
    });

    return {
      mediaQueryList: mediaQueryList,
      mediaQuery,
      parallaxAmount: parseInt(parallaxAmountString),
      objects,
    };
  })
  .reverse();

let currentScene = getCurrentScene();
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let mouseX = windowWidth / 2;
let mouseY = windowHeight / 2;
let followMouse = false;
/** @type {NodeJS.Timeout} */
let followMouseTimeout;
let offsetX = mouseX / windowWidth - 0.5;
let offsetY = mouseY / windowHeight - 0.5;
let rigidity = 0;

window.addEventListener("resize", () => {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
});

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  followMouse = true;
  clearTimeout(followMouseTimeout);
  followMouseTimeout = setTimeout(() => {
    followMouse = false;
    rigidity = 0
  }, 15000);
});

/**
 * @param {DOMHighResTimeStamp} time
 */
function animate(time) {
  const { parallaxAmount } = currentScene;

  let newOffsetX = 0;
  let newOffsetY = 0;

  if (followMouse) {
    newOffsetX = mouseX / windowWidth - 0.5;
    newOffsetY = mouseY / windowHeight - 0.5;
    rigidity = 0.5;
  } else {
    const orbitSpeed = (1 / (Math.PI * parallaxAmount)) * 0.02;
    newOffsetX = Math.sin(time * orbitSpeed) * 0.5;
    newOffsetY = Math.cos(time * orbitSpeed) * 0.5;
    if (rigidity < 1) {
      rigidity += 0.001;
    }
  }

  newOffsetX = offsetX + (newOffsetX - offsetX) * rigidity;
  newOffsetY = offsetY + (newOffsetY - offsetY) * rigidity;

  for (let sceneObject of currentScene.objects) {
    const x = newOffsetX * sceneObject.z * parallaxAmount;
    const y = newOffsetY * sceneObject.z * parallaxAmount;

    sceneObject.element.style.transform = `translate3d(${x}px, ${y}px, 1px)`;
  }

  offsetX = newOffsetX;
  offsetY = newOffsetY;

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
