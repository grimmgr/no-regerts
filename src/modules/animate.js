import * as THREE from 'three';
import {
  getLastTwoVertices,
  getRotationAngle,
  updatePositionArray,
} from './helpers';

const zNormal = new THREE.Vector3(0, 0, 1);

export const drawLine = (line, targetGeometry) => {
  const positionArray = line.geometry.attributes.position;
  const vertexCount = positionArray.count;
  const targetPositionArray = targetGeometry.attributes.position;
  let newVertex;

  // stop animation once target is drawn
  if (line.userData.inverseDrawn) return;

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
  if (!line.userData.drawInverse) {
    // if lastVertex is close to targetFirstVertex, start drawing target line
    if (lastVertex.distanceTo(targetFirstVertex) < 3) {
      line.userData.drawInverse = true;
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
  if (line.userData.drawInverse) {
    // stop if the entire line is drawn already
    if (line.userData.indexCounter === vertexCount) {
      line.userData.inverseDrawn = true;
      return;
    }
    // otherwise, trace line
    newVertex = new THREE.Vector3().fromBufferAttribute(
      targetPositionArray,
      line.userData.indexCounter
    );
    line.userData.indexCounter += 1;
  }

  updatePositionArray(positionArray, vertexCount, newVertex);
};

export const wander = (line) => {
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

export const animateLineGroup = (
  group,
  initialGeometries,
  inverseGeometries,
  pauseTime,
  onFrontFinished,
  onBackFinished
) => {
  group.userData.wanderShape && group.children.forEach((line) => wander(line));

  if (group.userData.drawInverseShape) {
    group.children.forEach((line, index) =>
      drawLine(line, inverseGeometries[index])
    );
  }

  if (group.userData.drawOriginalShape) {
    group.children.forEach((line, index) =>
      drawLine(line, initialGeometries[index])
    );
  }

  if (group.children.every((line) => line.userData.inverseDrawn === true)) {
    group.children.forEach((line) => {
      line.userData.drawInverse = false;
      line.userData.inverseDrawn = false;
    });
    // when back(inverse) finishes
    if (group.userData.drawCount % 2 === 0) {
      group.userData.drawInverseShape = false;
      onBackFinished();
      setTimeout(() => {
        group.userData.drawCount += 1;
        group.children.forEach((line) => (line.userData.indexCounter = 0));
        group.userData.wanderShape = true;
        setTimeout(() => {
          group.userData.wanderShape = false;
          group.userData.drawOriginalShape = true;
        }, pauseTime);
      }, pauseTime);
      // when front(original) finishes
    } else {
      group.userData.drawOriginalShape = false;
      onFrontFinished();
      setTimeout(() => {
        group.userData.drawCount += 1;
        group.children.forEach((line) => (line.userData.indexCounter = 0));
        group.userData.wanderShape = true;
        setTimeout(() => {
          group.userData.wanderShape = false;
          group.userData.drawInverseShape = true;
        }, pauseTime);
      }, pauseTime);
    }
  }

  group.children.forEach(
    (line) => (line.geometry.attributes.position.needsUpdate = true)
  );
};

// todo: use vertex shader instead
// export const displaceVertices = (mesh, geometry) => {
//   const positionArray = mesh.geometry.attributes.position;
//   const initialPositionArray = geometry.attributes.position;

//   const vertexCount = positionArray.count;

//   for (let i = 0; i < vertexCount; i++) {
//     positionArray.setXYZ(
//       i,
//       initialPositionArray.getX(i) + (Math.random() - 0.5) * 40,
//       initialPositionArray.getY(i) + (Math.random() - 0.5) * 40,
//       initialPositionArray.getZ(i) + (Math.random() - 0.5) * 40
//     );
//   }
// };

// export const displaceVerticesGroup = (group, geometries) => {
//   for (let i = 0; i < group.children.length; i++) {
//     displaceVertices(group.children[i], geometries[i]);
//   }

//   group.children.forEach(
//     (mesh) => (mesh.geometry.attributes.position.needsUpdate = true)
//   );
// };
