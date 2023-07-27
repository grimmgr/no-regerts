import * as THREE from 'three';
import { getView } from './helpers';
import { camera, scene } from './scene';

const white = new THREE.Color(0xffffff);
const black = new THREE.Color(0x000000);

export const loadBackdrop = () => {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('../textures/backdrop/paper_col.jpg');
  const normalTexture = textureLoader.load(
    '../textures/backdrop/paper_nrm.jpg'
  );

  const { height, width } = getView(camera);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      map: texture,
      normalMap: normalTexture,
      transparent: true,
      opacity: 0.2,
    })
  );
  plane.translateZ(-1);

  window.addEventListener('resize', () => {
    plane.scale.x = getView(camera).width;
  });

  scene.add(plane);
};

export const changeColors = (materials, drawCount, percent) => {
  scene.background
    .copy(white)
    .lerp(
      black,
      drawCount % 2 === 0 ? Math.pow(percent, 5) : Math.pow(1 - percent, 5)
    );

  materials.forEach((materialInfo) => {
    const { material, startColor, endColor } = materialInfo;
    material.color
      .copy(startColor)
      .lerp(
        endColor,
        drawCount % 2 === 0 ? Math.pow(percent, 5) : Math.pow(1 - percent, 5)
      );
  });
};
