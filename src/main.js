import './style.css';
import * as THREE from 'three';
import { camera, scene, setupScene } from './modules/scene';
import { initUserData, getGroupConstants } from './modules/helpers';
import { animateLineGroup } from './modules/animate';
import { loadSvgParticles, svgCenter } from './modules/svgParticles';
import { changeColors, loadBackdrop } from './modules/backdrop';
import { animateText, dropLetters } from './modules/text';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as dat from 'lil-gui';

// const gui = new dat.GUI();

const canvas = document.querySelector('canvas.webgl');
const container = document.querySelector('div.container');
const svgUrl = '../models/shapes.svg';

const stats = new Stats();
container.appendChild(stats.dom);

const { controls, render } = setupScene(canvas, scene, camera);

// Backdrop
loadBackdrop();

// Particles
const { svgParticleGroup } = await loadSvgParticles(svgUrl);
scene.add(svgParticleGroup);

initUserData(svgParticleGroup);

const {
  totalVertexCount,
  initialGeometries,
  inverseGeometries,
  materialToAnimate,
  pauseTime,
} = getGroupConstants(svgParticleGroup, svgCenter, ['3C3A3D', '434345']);

const onFrontFinished = () => {
  dropLetters(null, { color: 0x000000, orientation: 'horizontal' });
};

const onBackFinished = () => {
  dropLetters(['NO', 'REGERTS'], { color: 0xffffff, orientation: 'vertical' });
};

// after a pause, wander shape and then draw inverse
setTimeout(() => {
  svgParticleGroup.userData.wanderShape = true;
  setTimeout(() => {
    svgParticleGroup.userData.wanderShape = false;
    svgParticleGroup.userData.drawInverseShape = true;
  }, pauseTime);
}, pauseTime);

// Text
dropLetters(["I THINK WE'RE", 'HAVING FUN'], {
  color: 0x000000,
  orientation: 'horizontal',
});

const animate = () => {
  requestAnimationFrame(animate);

  controls.update();
  stats.update();

  render();

  // line animation
  animateLineGroup(
    svgParticleGroup,
    initialGeometries,
    inverseGeometries,
    pauseTime,
    onFrontFinished,
    onBackFinished
  );

  // background and material animation
  const percentVerticesDrawn =
    svgParticleGroup.children.reduce(
      (total, line) => total + line.userData.indexCounter,
      0
    ) / totalVertexCount;

  changeColors(
    materialToAnimate,
    svgParticleGroup.userData.drawCount,
    percentVerticesDrawn
  );

  // text animation
  animateText(percentVerticesDrawn);

  // wanderFor(4000);
};

animate();
// controls.addEventListener('change', render);
// render();

// to do
// spread out words
// chaos
// voice/volume input
