import { vec2, vec3, quat } from 'gl-matrix'
import { createRenderer } from './renderer';

async function main() {
	const bodyElement = document.body
	const mainElement = document.querySelector('main')

	let renderer = null
	let width = 0
	let height = 0
	let mainWidth = 0
	let mainHeight = 0
	let paddingX = 0
	let paddingY = 0

	const resizeObserver = new ResizeObserver((entries) => {
	  for (const entry of entries) {
	    if (entry.target === bodyElement) {
	      width = entry.contentBoxSize[0].inlineSize;
	      height = entry.contentBoxSize[0].blockSize;

	      if (renderer) {
		      renderer.resize(width, height)
	      }
	    } else if (entry.target === mainElement) {
	      mainWidth = entry.contentBoxSize[0].inlineSize;
	      mainHeight = entry.contentBoxSize[0].blockSize;
	    }
	  }

		paddingX = (width - mainWidth) * 0.5
		paddingY = (height - mainHeight) * 0.5
	});

	resizeObserver.observe(bodyElement)
	resizeObserver.observe(mainElement)

	renderer = await createRenderer()
	renderer.resize(width, height)

	document.body.appendChild(renderer.canvasElement)

	for (const icon of renderer.icons) {
		vec3.set(icon.translation, Math.random() * width, Math.random() * height, 240)
	}

  const force = vec2.create()

  let repulsionCoefficient = 1000
  let lastRenderTime = 0

  function handleAnimationFrame(renderTime) {
    const delta = (renderTime - lastRenderTime) * 0.001
    lastRenderTime = renderTime

    // Drop frame if delta is too high
    if (delta > 1) {
      return requestAnimationFrame(handleAnimationFrame)
    }

		const iconCount = renderer.icons.length
    const iconRadius = 40
    const iconDiameter = iconRadius * 2
    const iconDefaultSpeed = 40





    for (let i = 0; i < iconCount; i++) {
      const icon = renderer.icons[i];

      vec3.set(icon.scale, iconDiameter, iconDiameter, iconDiameter)

      for (let j = i + 1; j < iconCount; j++) {
        const icon2 = renderer.icons[j]
        const distance = Math.max(1, vec2.distance(
          icon.translation,
          icon2.translation,
        ) - iconDiameter)

        vec2.subtract(force, icon.translation, icon2.translation)
        vec2.normalize(force, force)

        // Repel current icon from the other
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )

        vec2.negate(force, force)

        // Repel the other icon from the current one
        vec2.scaleAndAdd(
          icon2.translationVelocity,
          icon2.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      if (icon.translation[0] < width * 0.5) {
        const distance = Math.max(1, icon.translation[0] - paddingX - iconRadius)
        vec2.set(force, 1, 0)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      } else {
        const distance = Math.max(1, width - icon.translation[0] - paddingX - iconRadius)
        vec2.set(force, -1, 0)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      if (icon.translation[1] < height * 0.5) {
        const distance = Math.max(1, icon.translation[1] - paddingY - iconRadius)
        vec2.set(force, 0, 1)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      } else {
        const distance = Math.max(1, height - icon.translation[1] - paddingY - iconRadius) 
        vec2.set(force, 0, -1)
        vec2.scaleAndAdd(
          icon.translationVelocity,
          icon.translationVelocity,
          force,
          repulsionCoefficient / (distance * distance) * delta
        )
      }

      vec2.scaleAndAdd(
        icon.translation,
        icon.translation,
        icon.translationVelocity,
        delta
      )

      const currentSpeed = vec2.length(icon.translationVelocity)
      vec2.normalize(force, icon.translationVelocity)
      vec2.scaleAndAdd(
        icon.translationVelocity,
        icon.translationVelocity,
        force,
        (iconDefaultSpeed - currentSpeed) * delta
      )

      quat.rotateX(
        icon.rotation,
        icon.rotation,
        icon.translationVelocity[0] * iconDefaultSpeed * delta * 0.001
      )
      quat.rotateY(
        icon.rotation,
        icon.rotation,
        icon.translationVelocity[1] * iconDefaultSpeed * delta * 0.001
      )
      quat.rotateZ(
        icon.rotation,
        icon.rotation,
        delta
      )
    }

		renderer.render(iconDiameter)

    requestAnimationFrame(handleAnimationFrame)
  }

  requestAnimationFrame(handleAnimationFrame)
}

main()
