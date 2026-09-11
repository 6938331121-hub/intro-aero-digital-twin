/**
 * Physics module for Stage 4: Live Cm–Alpha Relationship and Trim.
 *
 * Sign conventions:
 * - Positive pitching moment (Cm > 0) is nose-up.
 * - Positive angle of attack (alpha > 0) is nose-up.
 *
 * Key assumptions:
 * - Quasi-static linear aerodynamic model.
 * - Angles supplied in degrees are converted to radians for slope calculations.
 */

/**
 * Converts degrees to radians.
 * @param {number} deg - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 * @param {number} rad - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * Calculates pitching moment coefficient at a given angle of attack.
 * @param {number} cm0 - Zero-angle pitching moment coefficient
 * @param {number} cmAlphaPerRad - Pitching moment slope (1/rad)
 * @param {number} angleOfAttackDeg - Angle of attack (deg)
 * @returns {number} Pitching moment coefficient Cm(alpha)
 */
export function calculateCm(cm0, cmAlphaPerRad, angleOfAttackDeg) {
  const alphaRad = degToRad(angleOfAttackDeg);
  return cm0 + cmAlphaPerRad * alphaRad;
}

/**
 * Calculates trim angle of attack in degrees.
 * @param {number} cm0 - Zero-angle pitching moment coefficient
 * @param {number} cmAlphaPerRad - Pitching moment slope (1/rad)
 * @returns {number|string} Trim angle in degrees or "not available"
 */
export function calculateTrimAngle(cm0, cmAlphaPerRad) {
  if (Math.abs(cmAlphaPerRad) < 1e-12) {
    return "not available";
  }
  const alphaTrimRad = -cm0 / cmAlphaPerRad;
  return radToDeg(alphaTrimRad);
}

/**
 * Calculates disturbance moment coefficient change.
 * @param {number} cmAlphaPerRad - Pitching moment slope (1/rad)
 * @param {number} disturbanceAlphaDeg - Disturbance angle of attack (deg)
 * @returns {number} Disturbance moment change delta_Cm
 */
export function calculateDisturbanceResponse(cmAlphaPerRad, disturbanceAlphaDeg) {
  const deltaAlphaRad = degToRad(disturbanceAlphaDeg);
  return cmAlphaPerRad * deltaAlphaRad;
}

/**
 * Evaluates whether the selected condition is trimmed within tolerance (1e-6).
 * @param {number} cm - Pitching moment coefficient
 * @returns {boolean} True if trimmed
 */
export function checkIsTrimmed(cm) {
  return Math.abs(cm) <= 1e-6;
}

/**
 * Classifies disturbance response tendency based on sign of delta_alpha_rad * delta_Cm.
 * @param {number} disturbanceAlphaDeg - Disturbance angle of attack (deg)
 * @param {number} deltaCm - Moment change
 * @returns {string} "restoring", "destabilizing", or "neutral"
 */
export function classifyTendency(disturbanceAlphaDeg, deltaCm) {
  const deltaAlphaRad = degToRad(disturbanceAlphaDeg);
  const product = deltaAlphaRad * deltaCm;

  if (product < -1e-12) {
    return "restoring";
  } else if (product > 1e-12) {
    return "destabilizing";
  } else {
    return "neutral";
  }
}

/**
 * Primary analysis function evaluating all Stage 4 stability parameters.
 * @param {Object} aircraft - Canonical aircraft input fields
 * @returns {Object} Calculated stability outputs
 */
export function analyzeTrimResponse(aircraft = {}) {
  const {
    cm0 = 0,
    cmAlphaPerRad = 0,
    angleOfAttackDeg = 0,
    disturbanceAlphaDeg = 0
  } = aircraft;

  const cm = calculateCm(cm0, cmAlphaPerRad, angleOfAttackDeg);
  const trimAngleDeg = calculateTrimAngle(cm0, cmAlphaPerRad);
  const deltaCm = calculateDisturbanceResponse(cmAlphaPerRad, disturbanceAlphaDeg);
  const isTrimmed = checkIsTrimmed(cm);
  const tendency = classifyTendency(disturbanceAlphaDeg, deltaCm);

  return {
    cm,
    trimAngleDeg,
    deltaCm,
    isTrimmed,
    tendency
  };
}