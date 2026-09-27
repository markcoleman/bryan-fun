// Pose and camera geometry is independent of the canvas and never changes game physics.
export const POSE = Object.freeze({
  idle: 0,
  firstRun: 1,
  lastRun: 6,
  jump: 7,
  duck: 8,
  hurt: 9,
});
export function runnerPose(run) {
  if (run.status === "over") return POSE.hurt;
  if (run.duck > 0 && run.y === 0) return POSE.duck;
  if (run.y > 0) return POSE.jump;
  return POSE.firstRun + (Math.floor(run.scroll / 22) % 6);
}
export function spriteSize(frames, pose, standingHeight) {
  const scale = standingHeight / frames[POSE.idle].h;
  return { width: frames[pose].w * scale, height: frames[pose].h * scale };
}
export function tilePositions(
  scroll,
  factor,
  width,
  viewport = 800,
  phase = 0,
) {
  const positions = [];
  const offset = (((scroll * factor + phase) % width) + width) % width;
  for (let x = -offset; x < viewport; x += width) positions.push(x);
  return positions;
}
