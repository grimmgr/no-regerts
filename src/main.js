import './style.css';
import * as THREE from 'three';
import { setupScene } from './modules/scene';
import {
  initGroupTrackers,
  initAnimatedGroup,
  initMeshAnimationGroup,
  getGeometries,
} from './modules/helpers';
import {
  animateLineGroup,
  changeColors,
  displaceVerticesGroup,
  toggleTrackers,
} from './modules/animate';
import { loadSvgMesh } from './modules/svgMesh';
import { loadSvgParticles } from './modules/svgParticles';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as dat from 'lil-gui';

// const gui = new dat.GUI();

const canvas = document.querySelector('canvas.webgl');
const container = document.querySelector('div.container');
const svgUrl = '../models/shapes.svg';

const stats = new Stats();
container.appendChild(stats.dom);

const { camera, controls, scene, render } = setupScene(canvas);

// Mesh
const { svgMeshGroup } = await loadSvgMesh(svgUrl);
const meshGeometries = getGeometries(svgMeshGroup);
svgMeshGroup.translateZ(-1);
scene.add(svgMeshGroup);

const { mixer, action } = initMeshAnimationGroup(svgMeshGroup);
action.play();

// Particles
const { svgParticleGroup, svgCenter } = await loadSvgParticles(svgUrl);

const {
  totalVertexCount,
  initialGeometries,
  inverseGeometries,
  materialToAnimate,
  linesWithTrackers,
  pauseTime,
} = initAnimatedGroup(svgParticleGroup, svgCenter, ['3C3A3D', '434345']);

scene.add(svgParticleGroup);

const groupTrackers = initGroupTrackers();
const { wanderShape, drawInverseShape, drawOriginalShape, drawCount } =
  groupTrackers;

setTimeout(() => {
  toggleTrackers(pauseTime, wanderShape, drawInverseShape);
}, pauseTime);

const clock = new THREE.Clock();

const animate = () => {
  requestAnimationFrame(animate);
  // mixer
  const delta = clock.getDelta();
  mixer.update(delta);

  controls.update();
  stats.update();

  render();

  // mesh animation
  displaceVerticesGroup(svgMeshGroup, meshGeometries);

  // line animation
  animateLineGroup(
    linesWithTrackers,
    groupTrackers,
    initialGeometries,
    inverseGeometries,
    pauseTime,
    action
  );

  // background and material animation
  const percentVerticesDrawn =
    linesWithTrackers.reduce(
      (total, line) => total + line.indexCounter.value(),
      0
    ) / totalVertexCount;

  changeColors(scene, materialToAnimate, drawCount, percentVerticesDrawn);

  // wanderFor(4000);
};

animate();
// controls.addEventListener('change', render);
// render();
