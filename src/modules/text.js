import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { getCenter, getView, getRandomValueInRange, loadFont } from './helpers';
import { camera, scene } from './scene';
import { svgCenter } from './svgParticles';

const clock = new THREE.Clock();

const font = await loadFont('../fonts/didot_italic.json');
const textSize = 8;
const spacing = 1.5;
const textMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  color: 0x000000,
});

const letterGeometries = [];
let leftTextGroup, rightTextGroup;
const textGroup = new THREE.Group();
scene.add(textGroup);
const redColor = new THREE.Color().setStyle('#581216').convertSRGBToLinear();

const lyrics = [
  ['THIS PARTY', 'SUCKS'],
  ['WE ARE HAVING', 'A PARTY'],
  ['YOUR TATTOOS', 'ARE SO DEEP'],
  ["I THINK WE'RE", 'HAVING FUN'],
  ['BREAK A BOTTLE', 'CLEAN IT UP'],
  ['I JUST WANT SOME', 'CHIPS AND DIP'],
  ['I CAN SEE', 'YOUR NIP'],
  ['OHHHHH', 'HAPPINESS'],
  ['IM A GIANT', 'VAGINA'],
];

// opacity animation
const fadeOutAnimationGroup = new THREE.AnimationObjectGroup();
const fadeOutMixer = new THREE.AnimationMixer(fadeOutAnimationGroup);
let fadeColorAction;
const opacityKF = new THREE.NumberKeyframeTrack(
  '.material.opacity',
  [0, 1], // times
  [1, 0] // values
);
const fadeOut = new THREE.AnimationClip('fadeOut', -1, [opacityKF]);
const fadeOutAction = fadeOutMixer.clipAction(fadeOut);
fadeOutAction.clampWhenFinished = true;
fadeOutAction.setLoop(THREE.LoopOnce);

const loadLetter = (letter) => {
  let textGeometry;
  // if the geometry has already been used, grab from cache
  const cachedLetterGeomtry = letterGeometries.find(
    (geo) => geo.name === letter
  );
  if (cachedLetterGeomtry) {
    textGeometry = cachedLetterGeomtry;
  } else {
    // otherwise make new geomtry
    textGeometry = new TextGeometry(letter, {
      font: font,
      size: textSize,
      height: 1,
    });
    textGeometry.name = letter;
    textGeometry.computeBoundingBox();
    textGeometry.userData.width = textGeometry.boundingBox.max.x;
    letterGeometries.push(textGeometry);
  }
  const letterMesh = new THREE.Mesh(textGeometry, textMaterial);
  letterMesh.translateZ(-5);
  // give letter random gravity value
  letterMesh.userData.gravity = getRandomValueInRange(0.5, 6);

  return letterMesh;
};

const loadVerticalText = (string) => {
  const screenHeight = getView(camera).height;
  const group = new THREE.Group();
  const wordHeight = string.length * textSize + (string.length - 1) * spacing;
  // create mesh for every letter in string
  const letterArray = string.split('');
  letterArray.forEach((letter, index) => {
    const letterMesh = loadLetter(letter);
    group.add(letterMesh);
    // target position for animation
    letterMesh.userData.targetPosition = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      // spread out letters vertically and center on y axis
      letterMesh.position.y - spacing * textSize * index + wordHeight / 2,
      letterMesh.position.z
    );
    // start position
    letterMesh.position.x = (Math.random() - 0.5) * 10;
    letterMesh.position.y = getRandomValueInRange(
      screenHeight / 2,
      screenHeight
    );
  });

  return group;
};

const addWidths = (totalWidth, mesh) =>
  totalWidth + mesh.geometry.userData.width;

export const loadHorizontalText = (string) => {
  const screenHeight = getView(camera).height;
  const screenWidth = getView(camera).width;
  const group = new THREE.Group();
  // split string into array of words
  const wordArray = string.split(/\s/);
  const ySpacing = screenHeight / (wordArray.length + 1);
  const xSpacing = (screenWidth / 2 - svgCenter.x) / (wordArray.length + 1);

  wordArray.forEach((word, index) => {
    let letterMeshes = [];
    const letterArray = word.split('');
    letterArray.forEach((letter) => {
      const letterMesh = loadLetter(letter);
      letterMesh.userData.wordIndex = index;
      group.add(letterMesh);
      letterMeshes.push(letterMesh);
    });

    const wordWidth = letterMeshes.reduce(addWidths, 0);

    letterMeshes.forEach((mesh, index) => {
      mesh.userData.targetPosition = new THREE.Vector3(
        // place letters side by side
        letterMeshes.slice(0, index).reduce(addWidths, 0) -
          // center word on x axis
          wordWidth / 2 +
          // space words evenly in white space
          xSpacing * mesh.userData.wordIndex -
          // center group on x axis
          ((wordArray.length - 1) * xSpacing) / 2,
        // space words evenly along y axis
        ySpacing * (wordArray.length - mesh.userData.wordIndex - 1) -
          // center group on y axis
          ((wordArray.length - 1) * ySpacing) / 2,
        mesh.position.z
      );
      // start position
      mesh.position.x = mesh.userData.targetPosition.x;
      mesh.position.y = getRandomValueInRange(screenHeight / 2, screenHeight);
    });
  });
  return group;
};

export const dropLetters = (textArr, options) => {
  clock.stop();
  textGroup.remove(leftTextGroup, rightTextGroup);

  // animation cleanup
  textGroup.children.forEach((group) =>
    group.children.forEach((mesh) => fadeOutAnimationGroup.remove(mesh))
  );
  if (fadeColorAction) {
    fadeColorAction.stop();
    fadeOutMixer.uncacheAction(fadeColorAction);
  }
  textGroup.userData.fadeOutTriggered = false;
  textGroup.userData.fadeColorTriggered = false;

  const { color, orientation } = options;
  textMaterial.color.setHex(color);
  textMaterial.opacity = 1;

  // fade animation
  const colorKF = new THREE.ColorKeyframeTrack(
    '.material.color',
    [0, 5], // times
    [
      textMaterial.color.r,
      textMaterial.color.g,
      textMaterial.color.b,
      redColor.r,
      redColor.g,
      redColor.b,
    ] // values
  );
  const fadeColor = new THREE.AnimationClip('fadeOut', -1, [colorKF]);
  fadeColorAction = fadeOutMixer.clipAction(fadeColor);
  fadeColorAction.clampWhenFinished = true;
  fadeColorAction.setLoop(THREE.LoopOnce);

  // use text or pull random lyrics
  const text = textArr || lyrics[Math.floor(Math.random() * lyrics.length)];
  // load text
  if (orientation === 'vertical') {
    leftTextGroup = loadVerticalText(text[0]);
    rightTextGroup = loadVerticalText(text[1]);
  } else {
    leftTextGroup = loadHorizontalText(text[0]);
    rightTextGroup = loadHorizontalText(text[1]);
  }
  // position in whitespace
  const whiteSpaceCenter =
    svgCenter.x + (getView(camera).width / 2 - svgCenter.x) / 2;
  leftTextGroup.translateX(-whiteSpaceCenter);
  rightTextGroup.translateX(whiteSpaceCenter);

  clock.start();
  textGroup.add(leftTextGroup, rightTextGroup);
  textGroup.children.forEach((group) =>
    group.children.forEach((mesh) => fadeOutAnimationGroup.add(mesh))
  );
};

export const animateText = (percentVerticesDrawn) => {
  if (textGroup.children.length === 2) {
    textGroup.children.forEach((group) =>
      group.children.forEach((mesh) => {
        if (mesh.position.y > mesh.userData.targetPosition.y) {
          mesh.position.y +=
            -0.5 * mesh.userData.gravity * Math.pow(clock.getElapsedTime(), 2);
        } else {
          mesh.position.lerp(mesh.userData.targetPosition, 0.3);
        }
      })
    );
    if (
      percentVerticesDrawn > 0.6 &&
      percentVerticesDrawn < 1 &&
      textGroup.userData.fadeColorTriggered === false
    ) {
      // trigger fade color animation
      fadeColorAction.reset().play();
      textGroup.userData.fadeColorTriggered = true;
    }
    if (
      percentVerticesDrawn > 0.96 &&
      percentVerticesDrawn < 1 &&
      textGroup.userData.fadeOutTriggered === false
    ) {
      // trigger fade out animation
      fadeOutAction.reset().play();
      textGroup.userData.fadeOutTriggered = true;
    }
  }
  fadeOutMixer.update(clock.getDelta());
};

// export const swingLetters = (group, time, percent, count) => {
//   const amplitude = 0.005;
//   const frequency = 1.5;
//   for (let i = 0; i < group.children.length; i++) {
//     group.children[i].rotation.z +=
//       Math.cos(frequency * (time - phaseShiftArray[i])) * amplitude;
//     group.children[i].material.opacity =
//       count.value() % 2 === 0 ? Math.pow(percent, 4) : Math.pow(1 - percent, 4);
//   }
// };
