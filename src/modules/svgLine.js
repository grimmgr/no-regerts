import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { getCenter } from '../modules/helpers';

export const loadSvgLineGroup = async (svgUrl) => {
  const svgLoader = new SVGLoader();

  const { paths } = await svgLoader.loadAsync(svgUrl);

  const svgLineGroup = new THREE.Group();
  svgLineGroup.scale.multiplyScalar(0.04);
  svgLineGroup.scale.y *= -1;

  for (let i = 0; i < paths.length; i++) {
    const strokeColor = paths[i].userData.style.stroke;

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color().setStyle(strokeColor).convertSRGBToLinear(),
    });

    let subPaths = paths[i].subPaths;

    for (let j = 0; j < subPaths.length; j++) {
      const points = subPaths[j].getPoints();
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);

      svgLineGroup.add(line);
    }
  }

  const svgCenter = getCenter(svgLineGroup);

  svgLineGroup.position.x = -svgCenter.x;
  svgLineGroup.position.y = -svgCenter.y;

  return { svgLineGroup, svgCenter };
};
