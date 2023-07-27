import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / innerHeight,
  1,
  1000
);

export const setupScene = (canvas, scene, camera) => {
  // scene
  // const scene = new THREE.Scene();
  scene.background = new THREE.Color();

  // camera
  // const camera = new THREE.PerspectiveCamera(
  //   50,
  //   window.innerWidth / innerHeight,
  //   1,
  //   1000
  // );
  camera.position.set(0, 0, 200);
  scene.add(camera);

  // renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const render = () => renderer.render(scene, camera);

  // light
  const pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.set(0, 0, 100);
  scene.add(pointLight);

  // controls
  const controls = new OrbitControls(camera, renderer.domElement);

  // window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
  });

  return { camera, controls, renderer, render, scene };
};
