import {
  calculateCm,
  analyzeTrimResponse
} from "../physics/trim-response.js";

export const feature = {
  contractVersion: 4,
  id: "trim-response",
  title: "Live Cm–Alpha Relationship and Trim",
  description: "Evaluates linear pitching moment, trim angle, and disturbance stability response.",
  category: "Stability · Student feature",
  learningMode: "concept",
  topicId: "stability",
  inputKeys: ["cm0", "cmAlphaPerRad", "angleOfAttackDeg", "disturbanceAlphaDeg"],
  requiresCapabilities: [{ id: "loads.pitch.component-sum", version: 1 }],
  providesCapabilities: [{ id: "stability.pitch.cm-alpha", version: 1 }],
  assumptions: [
    "Linear Cm-alpha relationship over the investigated angle of attack range.",
    "Quasi-static model representing small perturbations about the selected condition.",
    "Cm0 and Cm_alpha represent the same aircraft configuration and flight condition.",
    "Sign convention: positive pitching moment and positive angle of attack are nose-up."
  ],
  validityLimits: [
    "Invalid at stall, large angles of attack, or non-linear aerodynamic regimes.",
    "Does not calculate dynamic time history, damping, control motion, or handling quality.",
    "Restoring tendency does not guarantee airworthiness or complete safety.",
    "Calculated trim angle is valid only within the linear aerodynamic regime."
  ],
  simulation: {
    display: "analysis-only",
    durationS: 1,
    initialState: {},
    controls: {},
    disturbance: {}
  },

  analyze(aircraft, capabilityContext) {
    const res = analyzeTrimResponse(aircraft);

    const results = [
      {
        id: "cm",
        label: "Pitching Moment Coefficient Cm(α)",
        value: res.cm,
        unit: "",
        precision: 6,
        emphasis: true
      },
      {
        id: "trimAngle",
        label: "Trim Angle of Attack",
        value: res.trimAngleDeg,
        unit: typeof res.trimAngleDeg === "number" ? "deg" : "",
        precision: typeof res.trimAngleDeg === "number" ? 2 : undefined
      },
      {
        id: "deltaCm",
        label: "Disturbance Moment Change ΔCm",
        value: res.deltaCm,
        unit: "",
        precision: 6
      },
      {
        id: "isTrimmed",
        label: "Trim Status",
        value: res.isTrimmed ? "Trimmed" : "Not Trimmed",
        unit: ""
      },
      {
        id: "tendency",
        label: "Disturbance Tendency",
        value: res.tendency,
        unit: ""
      }
    ];

    const case1 = analyzeTrimResponse({ cm0: 0.04, cmAlphaPerRad: -0.8, angleOfAttackDeg: 2.86, disturbanceAlphaDeg: 2.00 });
    const case2 = analyzeTrimResponse({ cm0: 0.04, cmAlphaPerRad: 0.8, angleOfAttackDeg: 2.86, disturbanceAlphaDeg: 2.00 });
    const case3 = analyzeTrimResponse({ cm0: 0.04, cmAlphaPerRad: 0.0, angleOfAttackDeg: 2.86, disturbanceAlphaDeg: 2.00 });

    const verificationCases = [
      {
        id: "ref-calc",
        label: "9.1 Numerical Reference Case",
        passed:
          Math.abs(case1.cm - 0.000067) < 1e-4 &&
          typeof case1.trimAngleDeg === "number" &&
          Math.abs(case1.trimAngleDeg - 2.864789) < 1e-3 &&
          Math.abs(case1.deltaCm - (-0.027925)) < 1e-4 &&
          case1.tendency === "restoring",
        details: "Verifies basic calculations against manual Section 8 values."
      },
      {
        id: "behavioral",
        label: "9.2 Behavioral Trend Case",
        passed: case2.deltaCm > 0 && case2.tendency === "destabilizing",
        details: "Verifies positive slope creates destabilizing disturbance response."
      },
      {
        id: "boundary",
        label: "9.3 Boundary Zero-Slope Case",
        passed: case3.trimAngleDeg === "not available" && case3.deltaCm === 0 && case3.tendency === "neutral",
        details: "Verifies zero Cm_alpha yields no unique trim angle and neutral tendency."
      }
    ];

    const alphaPoints = [];
    for (let a = -10; a <= 10; a += 1) {
      alphaPoints.push(a);
    }
    const currentAlpha = aircraft?.angleOfAttackDeg ?? 0;
    if (typeof currentAlpha === "number" && !alphaPoints.includes(currentAlpha)) {
      alphaPoints.push(currentAlpha);
      alphaPoints.sort((a, b) => a - b);
    }

    const cmDataSeries = alphaPoints.map((a) => ({
      x: a,
      y: calculateCm(aircraft?.cm0 ?? 0, aircraft?.cmAlphaPerRad ?? 0, a)
    }));

    const plots = [
      {
        id: "cm-alpha-plot",
        title: "Cm vs. Angle of Attack (α)",
        xLabel: "Angle of Attack α (deg)",
        yLabel: "Pitching-Moment Coefficient Cm",
        series: [
          {
            label: "Cm(α)",
            points: cmDataSeries
          }
        ],
        referenceLines: [
          { axis: "y", value: 0, label: "Trim Line (Cm = 0)" }
        ],
        regions: []
      }
    ];

    return {
      results,
      verificationCases,
      decision: {
        question: "At the selected angle of attack, is the simplified pitching-moment model trimmed, and does a small angle-of-attack disturbance create a restoring moment tendency?",
        interpretation: `At α = ${aircraft?.angleOfAttackDeg ?? 0}°, Cm = ${res.cm.toFixed(6)} (${res.isTrimmed ? "trimmed" : "not trimmed"}). Disturbance tendency is ${res.tendency}.`,
        status: res.tendency === "restoring" ? "pass" : res.tendency === "neutral" ? "neutral" : "caution"
      },
      plots,
      scene: null
    };
  }
};

export const model = {
  kind: "derived",
  evaluate(runtimeContext) {
    const aircraft = runtimeContext?.aircraft || {};
    const res = analyzeTrimResponse(aircraft);
    return {
      values: {
        cm: res.cm,
        trimAngleDeg: res.trimAngleDeg,
        deltaCm: res.deltaCm,
        isTrimmed: res.isTrimmed ? 1 : 0
      }
    };
  }
};