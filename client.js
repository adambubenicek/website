// @ts-ignore
const parallaxAmount = PARALLAX_AMOUNT;

// @ts-ignore
const sceneSelector = SCENE_SELECTOR;

// @ts-ignore
const objectSelector = OBJECT_SELECTOR;

/**
 * @typedef  ClientScene
 * @property {string} mediaQuery
 * @property {MediaQueryList} mediaQueryList
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

    mediaQueryList.addEventListener("change", () => {
      currentScene = getCurrentScene();
    });

    const objects = Array.from(
      /** @type {NodeListOf<HTMLElement>}*/ (
        sceneElement.querySelectorAll(objectSelector)
      )
    ).map((sceneObjectElement) => {
      const z = /** @type {string} */ (sceneObjectElement.dataset.z);

      return {
        element: sceneObjectElement,
        x: 0,
        y: 0,
        z: parseFloat(z),
      };
    });

    return {
      mediaQueryList: mediaQueryList,
      mediaQuery,
      objects,
    };
  })
  .reverse();

let currentScene = getCurrentScene();

/**
 * @param {DOMHighResTimeStamp} time
 */
function animateAlways(time) {
  let newOffsetX = Math.sin((time * 2 * Math.PI) / 30000) * 0.5;
  let newOffsetY = Math.cos((time * 2 * Math.PI) / 30000) * 0.5;

  for (let sceneObject of currentScene.objects) {
    const x = newOffsetX * sceneObject.z * -parallaxAmount;
    const y = newOffsetY * sceneObject.z * -parallaxAmount;

    sceneObject.element.style.transform = `translate3d(${x}px, ${y}px, 1px)`;
  }

  requestAnimationFrame(animateAlways);
}

requestAnimationFrame(animateAlways);
