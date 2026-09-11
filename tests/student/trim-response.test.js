import { describe, it, expect } from "vitest";
import {
  degToRad,
  radToDeg,
  calculateCm,
  calculateTrimAngle,
  calculateDisturbanceResponse,
  checkIsTrimmed,
  classifyTendency,
  analyzeTrimResponse
} from "../../src/student/physics/trim-response.js";

describe("Trim and Response Physics Module", () => {
  it("correctly converts degrees to radians and vice versa", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 6);
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 6);
  });

  it("calculates Section 8 reference calculation (Section 9.1 Numerical Case)", () => {
    const input = {
      cm0: 0.04,
      cmAlphaPerRad: -0.8,
      angleOfAttackDeg: 2.86,
      disturbanceAlphaDeg: 2.0
    };

    const result = analyzeTrimResponse(input);

    expect(result.cm).toBeCloseTo(0.000067, 5);
    expect(result.trimAngleDeg).toBeCloseTo(2.864789, 5);
    expect(result.deltaCm).toBeCloseTo(-0.027925, 5);
    expect(result.isTrimmed).toBe(false);
    expect(result.tendency).toBe("restoring");
  });

  it("handles positive Cm_alpha slope resulting in destabilizing tendency (Section 9.2 Behavioral Case)", () => {
    const input = {
      cm0: 0.04,
      cmAlphaPerRad: 0.8,
      angleOfAttackDeg: 2.86,
      disturbanceAlphaDeg: 2.0
    };

    const result = analyzeTrimResponse(input);

    expect(result.deltaCm).toBeGreaterThan(0);
    expect(result.tendency).toBe("destabilizing");
  });

  it("handles zero Cm_alpha slope boundary case (Section 9.3 Boundary Case)", () => {
    const input = {
      cm0: 0.04,
      cmAlphaPerRad: 0.0,
      angleOfAttackDeg: 2.86,
      disturbanceAlphaDeg: 2.0
    };

    const result = analyzeTrimResponse(input);

    expect(result.trimAngleDeg).toBe("not available");
    expect(result.deltaCm).toBe(0);
    expect(result.tendency).toBe("neutral");
  });

  it("correctly evaluates trim condition threshold (abs(Cm) <= 1e-6)", () => {
    expect(checkIsTrimmed(0.0)).toBe(true);
    expect(checkIsTrimmed(1e-7)).toBe(true);
    expect(checkIsTrimmed(-1e-7)).toBe(true);
    expect(checkIsTrimmed(1e-5)).toBe(false);
  });
});