import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { getCenter } from '../modules/helpers';

export let svgCenter = new THREE.Vector3();

export const loadSvgParticles = async (svgUrl) => {
  const svgLoader = new SVGLoader();

  const { paths } = await svgLoader.loadAsync(svgUrl);

  const svgParticleGroup = new THREE.Group();
  svgParticleGroup.scale.multiplyScalar(0.04);
  svgParticleGroup.scale.y *= -1;

  const particleTexture = new THREE.TextureLoader().load(
    'textures/particles/fire_01.png'
  );

  for (let i = 0; i < paths.length; i++) {
    const strokeColor = paths[i].userData.style.stroke;
    const material = new THREE.PointsMaterial({
      alphaMap: particleTexture,
      color: new THREE.Color().setStyle(strokeColor).convertSRGBToLinear(),
      map: particleTexture,
      size: 6,
      transparent: true,
    });

    let subPaths = paths[i].subPaths;

    for (let j = 0; j < subPaths.length; j++) {
      const points = subPaths[j].getPoints();
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const particles = new THREE.Points(geometry, material);

      svgParticleGroup.add(particles);
    }
  }

  svgCenter = getCenter(svgParticleGroup);

  svgParticleGroup.position.x = -svgCenter.x;
  svgParticleGroup.position.y = -svgCenter.y;

  return { svgParticleGroup };
};
