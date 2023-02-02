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

/**
 * @param {DOMHighResTimeStamp} time
 */
function animateAlways(time) {
  const { parallaxAmount } = currentScene;
  const orbitSpeed = (1 / (Math.PI * parallaxAmount)) * 0.02;

  const newOffsetX = Math.sin(time * orbitSpeed) * 0.5;
  const newOffsetY = Math.cos(time * orbitSpeed) * 0.5;

  for (let sceneObject of currentScene.objects) {
    const x = newOffsetX * sceneObject.z * parallaxAmount;
    const y = newOffsetY * sceneObject.z * parallaxAmount;

    sceneObject.element.style.transform = `translate3d(${x}px, ${y}px, 1px)`;
  }

  requestAnimationFrame(animateAlways);
}

requestAnimationFrame(animateAlways);
