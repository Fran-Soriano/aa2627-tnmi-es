// E0. Forme geometriche reattive
//
// Composizione ispirata a esempio.jpeg; il mouse mette in movimento le forme.

const referenceWidth = 736;
const referenceHeight = 1104;
const backgroundColor = "#fff1d3";
const darkGreen = "#416808";
const coral = "#ff5055";
const orange = "#ff8735";
const green = "#5dad2c";
const pink = "#fb818d";
const yellow = "#ffbb00";
const deepOrange = "#f15d2c";
const gravity = 0.22;
const bounceStrength = 0.58;
const shapeBounceStrength = 0.22;
const shapeBounceTransfer = 0.12;
const mouseInfluenceRadius = 115;
const mousePushStrength = 4;
const mouseSwipeStrength = 0.035;
const maximumSpeed = 12;
const maximumRotationSpeed = 0.035;
const interactionDelay = 500;

let shapes = [];
let layoutScale = 1;
let layoutOffsetX = 0;
let layoutOffsetY = 0;
let previousMouseX;
let previousMouseY;
let pointerInitialized = false;
let interactionStartsAt;

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  interactionStartsAt = millis() + interactionDelay;
  createComposition();
  updateLayout();
}

function createComposition() {
  shapes = [
    createShape("circle", 322, 145, 58, darkGreen),
    createShape("semicircle", 381, 190, 232, coral, -0.24, 232, 146),
    createShape("rectangle", 442, 364, 229, orange, 0, 229, 114),
    createShape("semicircle", 428, 420, 335, green, 0, 335, 153),
    createShape("circle", 218, 619, 128, pink),
    createShape("rectangle", 467, 648, 148, yellow, 0, 148, 149),
    createShape("semicircle", 361, 947, 470, deepOrange, PI, 470, 226),
    createShape("circle", 305, 385, 22, darkGreen),
    createShape("rectangle", 578, 377, 42, coral, 0, 42, 48),
    createShape("circle", 368, 620, 22, green),
    createShape("circle", 563, 610, 22, coral),
    createShape("rectangle", 562, 700, 42, yellow, 0, 42, 44),
    createShape("circle", 601, 472, 19, green)
  ];
}

function createShape(type, x, y, radius, color, rotation = 0, shapeWidth, shapeHeight) {
  return {
    type,
    x,
    y,
    radius,
    color,
    rotation,
    shapeWidth,
    shapeHeight,
    velocityX: 0,
    velocityY: 0,
    rotationSpeed: 0,
    isFalling: false,
    previousY: y,
    previousRotation: rotation
  };
}

function updateLayout() {
  layoutScale = min(width / referenceWidth, height / referenceHeight);
  layoutOffsetX = (width - referenceWidth * layoutScale) / 2;
  layoutOffsetY = (height - referenceHeight * layoutScale) / 2;
}

function draw() {
  background(backgroundColor);
  const frameStep = min(deltaTime / (1000 / 60), 2);

  push();
  translate(layoutOffsetX, layoutOffsetY);
  scale(layoutScale);

  for (const shape of shapes) {
    updateShape(shape, frameStep);
  }

  resolveShapeCollisions();

  for (const shape of shapes) {
    drawShape(shape);
  }

  pop();
}

function updateShape(shape, frameStep) {
  if (!shape.isFalling) return;

  shape.previousY = shape.y;
  shape.previousRotation = shape.rotation;
  shape.velocityY += gravity * frameStep;
  shape.x += shape.velocityX * frameStep;
  shape.y += shape.velocityY * frameStep;
  shape.rotation += shape.rotationSpeed * frameStep;
  shape.velocityX *= 0.998;
  shape.rotationSpeed *= 0.999;

  const bounds = getShapeBounds(shape);

  if (shape.x - bounds.left < 0) {
    shape.x = bounds.left;
    shape.velocityX = abs(shape.velocityX) * bounceStrength;
  } else if (shape.x + bounds.right > referenceWidth) {
    shape.x = referenceWidth - bounds.right;
    shape.velocityX = -abs(shape.velocityX) * bounceStrength;
  }

  if (shape.y - bounds.top < 0) {
    shape.y = bounds.top;
    shape.velocityY = abs(shape.velocityY) * bounceStrength;
  }

  if (shape.y + bounds.bottom > referenceHeight) {
    shape.y = referenceHeight - bounds.bottom;
    shape.velocityY = -abs(shape.velocityY) * bounceStrength;
    shape.velocityX *= 0.92 ** frameStep;
    shape.rotationSpeed *= 0.88 ** frameStep;
  }

  if (
    abs(shape.velocityY) < 0.08
    && shape.y + bounds.bottom >= referenceHeight - 1
  ) {
    shape.velocityY = 0;
  }
}

function resolveShapeCollisions() {
  for (let firstIndex = 0; firstIndex < shapes.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < shapes.length; secondIndex += 1) {
      const firstShape = shapes[firstIndex];
      const secondShape = shapes[secondIndex];
      const firstIsAbove = firstShape.previousY <= secondShape.previousY;
      const upperShape = firstIsAbove ? firstShape : secondShape;
      const lowerShape = firstIsAbove ? secondShape : firstShape;

      if (!upperShape.isFalling || upperShape.velocityY <= lowerShape.velocityY) {
        continue;
      }

      const upperPreviousBounds = getShapeBoundsAt(
        upperShape,
        upperShape.previousRotation
      );
      const lowerPreviousBounds = getShapeBoundsAt(
        lowerShape,
        lowerShape.previousRotation
      );
      const upperBounds = getShapeBounds(upperShape);
      const lowerBounds = getShapeBounds(lowerShape);
      const horizontalOverlap = (
        upperShape.x + upperBounds.right > lowerShape.x - lowerBounds.left
        && upperShape.x - upperBounds.left < lowerShape.x + lowerBounds.right
      );
      const wasAbove = (
        upperShape.previousY + upperPreviousBounds.bottom
        <= lowerShape.previousY - lowerPreviousBounds.top + 2
      );
      const reachedSurface = (
        upperShape.y + upperBounds.bottom
        >= lowerShape.y - lowerBounds.top
      );

      if (!horizontalOverlap || !wasAbove || !reachedSurface) continue;

      const impactSpeed = upperShape.velocityY - lowerShape.velocityY;
      upperShape.y = lowerShape.y - lowerBounds.top - upperBounds.bottom;
      upperShape.velocityY = lowerShape.velocityY - impactSpeed * shapeBounceStrength;
      lowerShape.velocityY += impactSpeed * shapeBounceTransfer;
      lowerShape.isFalling = true;
    }
  }
}

function getShapeBounds(shape) {
  return getShapeBoundsAt(shape, shape.rotation);
}

function getShapeBoundsAt(shape, rotation) {
  if (shape.type === "circle") {
    return {
      left: shape.radius,
      right: shape.radius,
      top: shape.radius,
      bottom: shape.radius
    };
  }

  const halfWidth = shape.shapeWidth / 2;
  const cosine = cos(rotation);
  const sine = sin(rotation);

  if (shape.type === "rectangle") {
    const halfHeight = shape.shapeHeight / 2;
    const horizontalExtent = abs(cosine) * halfWidth + abs(sine) * halfHeight;
    const verticalExtent = abs(sine) * halfWidth + abs(cosine) * halfHeight;

    return {
      left: horizontalExtent,
      right: horizontalExtent,
      top: verticalExtent,
      bottom: verticalExtent
    };
  }

  const horizontalExtent = abs(cosine) * halfWidth
    + abs(sine) * shape.shapeHeight;
  const verticalExtent = abs(sine) * halfWidth;

  return {
    left: horizontalExtent,
    right: horizontalExtent,
    top: verticalExtent + max(0, -cosine * shape.shapeHeight),
    bottom: verticalExtent + max(0, cosine * shape.shapeHeight)
  };
}

function drawShape(shape) {
  push();
  translate(shape.x, shape.y);
  rotate(shape.rotation);
  noStroke();
  fill(shape.color);

  if (shape.type === "circle") {
    circle(0, 0, shape.radius * 2);
  } else if (shape.type === "rectangle") {
    rect(0, 0, shape.shapeWidth, shape.shapeHeight);
  } else {
    drawSemicircle(shape.shapeWidth, shape.shapeHeight);
  }

  pop();
}

function drawSemicircle(shapeWidth, shapeHeight) {
  const halfWidth = shapeWidth / 2;
  beginShape();
  vertex(-halfWidth, 0);
  vertex(halfWidth, 0);

  for (let step = 1; step <= 12; step += 1) {
    const progress = step / 12;
    vertex(
      cubicBezier(halfWidth, halfWidth, halfWidth * 0.58, 0, progress),
      cubicBezier(0, shapeHeight * 0.7, shapeHeight, shapeHeight, progress)
    );
  }

  for (let step = 1; step <= 12; step += 1) {
    const progress = step / 12;
    vertex(
      cubicBezier(0, -halfWidth * 0.58, -halfWidth, -halfWidth, progress),
      cubicBezier(shapeHeight, shapeHeight, shapeHeight * 0.7, 0, progress)
    );
  }

  endShape(CLOSE);
}

function cubicBezier(start, firstControl, secondControl, end, progress) {
  const inverseProgress = 1 - progress;

  return (
    inverseProgress ** 3 * start
    + 3 * inverseProgress ** 2 * progress * firstControl
    + 3 * inverseProgress * progress ** 2 * secondControl
    + progress ** 3 * end
  );
}

function mouseMoved() {
  pushNearbyShapes();
}

function mouseDragged() {
  pushNearbyShapes();
}

function pushNearbyShapes() {
  const pointerX = (mouseX - layoutOffsetX) / layoutScale;
  const pointerY = (mouseY - layoutOffsetY) / layoutScale;

  if (millis() < interactionStartsAt) return;

  if (!pointerInitialized) {
    previousMouseX = pointerX;
    previousMouseY = pointerY;
    pointerInitialized = true;
    return;
  }

  const swipeX = pointerX - previousMouseX;
  const swipeY = pointerY - previousMouseY;
  previousMouseX = pointerX;
  previousMouseY = pointerY;

  for (const shape of shapes) {
    const offsetX = shape.x - pointerX;
    const offsetY = shape.y - pointerY;
    const distance = Math.hypot(offsetX, offsetY);
    const distanceFromEdge = max(0, distance - shape.radius * 0.55);
    if (distanceFromEdge >= mouseInfluenceRadius) continue;

    const influence = 1 - distanceFromEdge / mouseInfluenceRadius;
    const directionX = distance > 0 ? offsetX / distance : 0;
    const directionY = distance > 0 ? offsetY / distance : -1;
    const pushX = directionX * mousePushStrength * influence;
    const pushY = directionY * mousePushStrength * influence;
    const swipeForceX = swipeX * mouseSwipeStrength * influence;
    const swipeForceY = swipeY * mouseSwipeStrength * influence;

    shape.isFalling = true;
    shape.velocityX = constrain(
      shape.velocityX + pushX + swipeForceX,
      -maximumSpeed,
      maximumSpeed
    );
    shape.velocityY = constrain(
      shape.velocityY + pushY + swipeForceY,
      -maximumSpeed,
      maximumSpeed
    );
    shape.rotationSpeed = constrain(shape.rotationSpeed + (
      offsetX * (pushY + swipeForceY)
      - offsetY * (pushX + swipeForceX)
    ) * 0.000004, -maximumRotationSpeed, maximumRotationSpeed);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLayout();
}
