import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { getCenter } from '../modules/helpers';

export const loadSvgMesh = async (svgUrl) => {
  const svgLoader = new SVGLoader();

  const { paths } = await svgLoader.loadAsync(svgUrl);

  const svgMeshGroup = new THREE.Group();
  svgMeshGroup.scale.multiplyScalar(0.0403);
  svgMeshGroup.scale.y *= -1;

  paths.forEach((path) => {
    const strokeColor = path.userData.style.stroke;
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setStyle(strokeColor).convertSRGBToLinear(),
      opacity: 0,
      transparent: true,
      wireframe: true,
    });

    path.subPaths.forEach((subPath) => {
      const geometry = SVGLoader.pointsToStroke(
        subPath.getPoints(),
        path.userData.style
      );

      if (geometry) {
        const mesh = new THREE.Mesh(geometry, material);
        svgMeshGroup.add(mesh);
      }
    });
  });

  const svgMeshCenter = getCenter(svgMeshGroup);
  svgMeshGroup.position.x = -svgMeshCenter.x;
  svgMeshGroup.position.y = -svgMeshCenter.y;

  return { svgMeshGroup, svgMeshCenter };
};
