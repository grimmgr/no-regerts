import * as THREE from 'three';
import {
  getLastTwoVertices,
  getRotationAngle,
  updatePositionArray,
} from './helpers';

const zNormal = new THREE.Vector3(0, 0, 1);
const white = new THREE.Color(0xdcdcdc);
const black = new THREE.Color(0x000000);

export const drawLine = (drawLine, targetGeometry) => {
  const { line, indexCounter, inverseDrawn, drawInverse } = drawLine;
  const positionArray = line.geometry.attributes.position;
  const vertexCount = positionArray.count;
  const targetPositionArray = targetGeometry.attributes.position;
  let newVertex;

  // stop animation once target is drawn
  if (inverseDrawn.value()) return;

  // get position of first vertex of target line
  const targetFirstVertex = new THREE.Vector3().fromBufferAttribute(
    targetPositionArray,
    0
  );

  const { lastVertex, secondTolastVertex } = getLastTwoVertices(
    positionArray,
    vertexCount
  );

  // line is moving toward target
  if (!drawInverse.value()) {
    // if lastVertex is close to targetFirstVertex, start drawing target line
    if (lastVertex.distanceTo(targetFirstVertex) < 3) {
      drawInverse.setTrue();
    } else {
      // otherwise, move line toward first vertex of target
      newVertex =
        Math.random() > 0.95
          ? targetFirstVertex.sub(lastVertex)
          : lastVertex.clone().sub(secondTolastVertex);
      newVertex
        .setLength((Math.random() + 0.5) * 5)
        .applyAxisAngle(zNormal, getRotationAngle())
        .add(lastVertex);
    }
  }

  // if line is tracing target
  if (drawInverse.value()) {
    // stop if the entire line is drawn already
    if (indexCounter.value() === vertexCount) {
      inverseDrawn.setTrue();
      return;
    }
    // otherwise, trace line
    newVertex = new THREE.Vector3().fromBufferAttribute(
      targetPositionArray,
      indexCounter.value()
    );
    indexCounter.increment();
  }

  updatePositionArray(positionArray, vertexCount, newVertex);
};

export const drawGroup = (drawGroup, targetGeometries) => {
  for (let i = 0; i < drawGroup.length; i++) {
    drawLine(drawGroup[i], targetGeometries[i]);
  }
};

export const wander = (drawLine) => {
  const { line } = drawLine;

  const positionArray = line.geometry.attributes.position;
  const vertexCount = positionArray.count;
  let newVertex;

  const { lastVertex, secondTolastVertex } = getLastTwoVertices(
    positionArray,
    vertexCount
  );

  // continue in direction line is pointing
  newVertex = lastVertex.clone().sub(secondTolastVertex);
  newVertex
    // preserve lenth of line
    // .setLength(getDistance(positionArray, 0))
    .setLength((Math.random() + 0.5) * 5)
    .applyAxisAngle(zNormal, getRotationAngle())
    .add(lastVertex);

  updatePositionArray(positionArray, vertexCount, newVertex);
};

export const toggleTrackers = (num, firstTracker, nextTracker) => {
  firstTracker.setTrue();
  setTimeout(() => {
    firstTracker.setFalse();
    nextTracker.setTrue();
  }, num);
};

export const animateLineGroup = (
  groupWithTrackers,
  groupTrackers,
  initialGeometries,
  inverseGeometries,
  pauseTime,
  action
) => {
  const { wanderShape, drawInverseShape, drawOriginalShape, drawCount } =
    groupTrackers;

  wanderShape.value() && groupWithTrackers.forEach((line) => wander(line));

  if (drawInverseShape.value()) {
    drawGroup(groupWithTrackers, inverseGeometries);
  }

  if (drawOriginalShape.value()) {
    drawGroup(groupWithTrackers, initialGeometries);
  }

  if (groupWithTrackers.every((line) => line.inverseDrawn.value() === true)) {
    groupWithTrackers.forEach((line) => {
      line.drawInverse.setFalse();
      line.inverseDrawn.setFalse();
    });

    if (drawCount.value() % 2 === 0) {
      drawInverseShape.setFalse();
      setTimeout(() => {
        drawCount.increment();
        groupWithTrackers.forEach((line) => line.indexCounter.reset());
        toggleTrackers(pauseTime, wanderShape, drawOriginalShape);
      }, pauseTime);
    } else {
      drawOriginalShape.setFalse();
      action.reset().play();
      setTimeout(() => {
        drawCount.increment();
        groupWithTrackers.forEach((line) => line.indexCounter.reset());
        toggleTrackers(pauseTime, wanderShape, drawInverseShape);
      }, pauseTime);
    }
  }

  groupWithTrackers.forEach(
    (trackedLine) =>
      (trackedLine.line.geometry.attributes.position.needsUpdate = true)
  );
};

// todo: use vertex shader instead
export const displaceVertices = (mesh, geometry) => {
  const positionArray = mesh.geometry.attributes.position;
  const initialPositionArray = geometry.attributes.position;

  const vertexCount = positionArray.count;

  for (let i = 0; i < vertexCount; i++) {
    positionArray.setXYZ(
      i,
      initialPositionArray.getX(i) + (Math.random() - 0.5) * 40,
      initialPositionArray.getY(i) + (Math.random() - 0.5) * 40,
      initialPositionArray.getZ(i) + (Math.random() - 0.5) * 40
    );
  }
};

export const displaceVerticesGroup = (group, geometries) => {
  for (let i = 0; i < group.children.length; i++) {
    displaceVertices(group.children[i], geometries[i]);
  }

  group.children.forEach(
    (mesh) => (mesh.geometry.attributes.position.needsUpdate = true)
  );
};

export const changeColors = (scene, materials, drawCount, percent) => {
  scene.background
    .copy(white)
    .lerp(
      black,
      drawCount.value() % 2 === 0
        ? Math.pow(percent, 5)
        : Math.pow(1 - percent, 1 / 4)
    );

  materials.forEach((materialInfo) => {
    const { material, startColor, endColor } = materialInfo;
    material.color
      .copy(startColor)
      .lerp(
        endColor,
        drawCount.value() % 2 === 0
          ? Math.pow(percent, 5)
          : Math.pow(1 - percent, 1 / 4)
      );
  });
};
