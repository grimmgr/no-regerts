import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { svgCenter } from './svgParticles';

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

export const initUserData = (group) => {
  group.userData = {
    wanderShape: false,
    drawInverseShape: false,
    drawOriginalShape: false,
    drawCount: 0,
  };
  group.children.forEach((mesh) => {
    mesh.userData = {
      indexCounter: 0,
      inverseDrawn: false,
      drawInverse: false,
    };
  });
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

export const getGroupConstants = (group, center, colorArray) => {
  const totalVertexCount = group.children.reduce(
    (total, line) => total + line.geometry.attributes.position.count,
    0
  );
  const initialGeometries = getGeometries(group);
  const inverseGeometries = getInverseGeometries(group, center);
  const materialToAnimate = getMaterialToAnimate(group, colorArray);
  const pauseTime = 6000;

  return {
    totalVertexCount,
    initialGeometries,
    inverseGeometries,
    materialToAnimate,
    pauseTime,
  };
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

export const loadFont = (fontUrl) => {
  return new Promise((resolve) => {
    new FontLoader().load(fontUrl, resolve);
  });
};

export const getView = (camera) => {
  const vFOV = THREE.MathUtils.degToRad(camera.fov); // convert vertical fov to radians
  const height = 2 * Math.tan(vFOV / 2) * 201; // visible height
  const width = height * camera.aspect; // visible width

  return { height, width };
};

export const getRandomValueInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};
