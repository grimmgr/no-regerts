import * as THREE from 'three';
import { makeCounter, trackBoolean } from './trackers';

export const getCenter = (object) => {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const target = new THREE.Vector3();
  const center = boundingBox.getCenter(target);
  return center;
};

export const getGeometries = (group) => {
  const geometries = [];

  group.children.forEach((line) => {
    const geometryClone = line.geometry.clone();

    geometries.push(geometryClone);
  });

  return geometries;
};

export const getInverseGeometries = (group, center) => {
  const inverseGeometries = [];
  group.children.forEach((line) => {
    const geometryClone = line.geometry.clone();
    const positionArray = geometryClone.attributes.position;

    for (let i = 0; i < positionArray.count; i++) {
      positionArray.setXYZ(
        i,
        positionArray.getX(i),
        -positionArray.getY(i) - 50 * center.y,
        positionArray.getZ(i)
      );
    }

    inverseGeometries.push(geometryClone);
  });

  return inverseGeometries;
};

export const initTrackers = (group) => {
  const trackerGroup = group.children.map((line) => {
    return {
      line: line,
      indexCounter: makeCounter(0),
      inverseDrawn: trackBoolean(false),
      drawInverse: trackBoolean(false),
    };
  });

  return trackerGroup;
};

export const getMaterialToAnimate = (group, colorArray) => {
  const materialToAnimate = group.children.reduce((materialArray, line) => {
    const hexColor = line.material.color
      .clone()
      .convertLinearToSRGB()
      .getHexString()
      .toUpperCase();
    if (colorArray.includes(hexColor)) {
      const inverseColor = invertColor(hexColor);
      const materialInfo = {
        material: line.material,
        startColor: line.material.color.clone(),
        endColor: new THREE.Color()
          .setStyle(inverseColor)
          .convertSRGBToLinear(),
      };
      return [...materialArray, materialInfo];
    }
    return materialArray;
  }, []);

  return materialToAnimate;
};

export const initAnimatedGroup = (group, center, colorArray) => {
  const totalVertexCount = group.children.reduce(
    (total, line) => total + line.geometry.attributes.position.count,
    0
  );
  const initialGeometries = getGeometries(group, center);
  const inverseGeometries = getInverseGeometries(group, center);
  const materialToAnimate = getMaterialToAnimate(group, colorArray);
  const linesWithTrackers = initTrackers(group, center);
  const pauseTime = 6000;

  return {
    totalVertexCount,
    initialGeometries,
    inverseGeometries,
    materialToAnimate,
    linesWithTrackers,
    pauseTime,
  };
};

export const initGroupTrackers = () => {
  const wanderShape = trackBoolean(false);
  const drawInverseShape = trackBoolean(false);
  const drawOriginalShape = trackBoolean(false);
  const drawCount = makeCounter(0);

  return {
    wanderShape,
    drawInverseShape,
    drawOriginalShape,
    drawCount,
  };
};

export const initMeshAnimationGroup = (group) => {
  const animationGroup = new THREE.AnimationObjectGroup();
  group.children.forEach((mesh) => animationGroup.add(mesh));

  const mixer = new THREE.AnimationMixer(animationGroup);

  const opacityKF = new THREE.NumberKeyframeTrack(
    '.material.opacity',
    [0, 3, 6],
    [0, 0.7, 0]
  );

  opacityKF.setInterpolation(THREE.InterpolateSmooth);

  const fadeInOut = new THREE.AnimationClip('fadeInOut', -1, [opacityKF]);

  const action = mixer.clipAction(fadeInOut);
  action.setLoop(THREE.LoopOnce);

  return { mixer, action };
};

export const getLastTwoVertices = (positionArray, vertexCount) => {
  // get position of last vertex
  const lastVertex = new THREE.Vector3().fromBufferAttribute(
    positionArray,
    vertexCount - 1
  );
  // get position of second to last vertex
  const secondTolastVertex = new THREE.Vector3().fromBufferAttribute(
    positionArray,
    vertexCount - 2
  );
  return { lastVertex, secondTolastVertex };
};

export const getRotationAngle = () =>
  Math.random() > 0.98
    ? posOrNeg(Math.PI / 2)
    : Math.random() > 0.9
    ? ((Math.random() - 0.5) * Math.PI) / 4
    : 0;

export const getDistance = (positionArray, index) => {
  const firstVertex = new THREE.Vector3().fromBufferAttribute(
    positionArray,
    index
  );
  const secondVertex = new THREE.Vector3().fromBufferAttribute(
    positionArray,
    index + 1
  );
  const distance = firstVertex.distanceTo(secondVertex);

  return distance;
};

export const updatePositionArray = (positionArray, vertexCount, newVertex) => {
  for (let i = 0; i < vertexCount; i++) {
    if (i === vertexCount - 1) {
      positionArray.setXYZ(i, newVertex.x, newVertex.y, 0);
    } else {
      positionArray.setXYZ(
        i,
        positionArray.getX(i + 1),
        positionArray.getY(i + 1),
        positionArray.getZ(i + 1)
      );
    }
  }
};

const padZero = (str, len) => {
  len = len || 2;
  var zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
};

const invertColor = (hex) => {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  // invert color components
  var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
    g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
    b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b);
};

export const posOrNeg = (num) => (Math.random() > 0.5 ? -1 * num : 1 * num);
