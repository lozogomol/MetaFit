export type ExerciseType =
  | 'squat'
  | 'bicepCurl'
  | 'shoulderPress'
  | 'abdominals'
  | 'gluteKickback'
  | 'bulgarianSquat'
  | 'tricepExtension'
  | 'singleArmRow';

export type ExerciseState =
  | 'readyUp'
  | 'descending'
  | 'bottom'
  | 'ascending'
  | 'invalid';

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface AnalysisResult {
  reps: number;
  phase: ExerciseState;
  feedback: string;
  isFormCorrect: boolean;
  primaryAngle: number;
  errors: string[];
  repCompleted: boolean;
  trackingValid: boolean;
}

const LANDMARK_INDEX_MAP: Record<number, string> = {
  0: 'nose',
  11: 'left_shoulder',
  12: 'right_shoulder',
  13: 'left_elbow',
  14: 'right_elbow',
  15: 'left_wrist',
  16: 'right_wrist',
  23: 'left_hip',
  24: 'right_hip',
  25: 'left_knee',
  26: 'right_knee',
  27: 'left_ankle',
  28: 'right_ankle',
};

class VectorMath {
  static calculateAngle(a: [number, number], b: [number, number], c: [number, number]): number {
    const radians =
      Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360.0 - angle;
    }
    return angle;
  }

  static calculateTorsoLean(shoulder: [number, number], hip: [number, number]): number {
    const verticalPoint: [number, number] = [hip[0], hip[1] - 0.5];
    return this.calculateAngle(shoulder, hip, verticalPoint);
  }
}

class ExponentialFilter {
  private alpha: number;
  private value: number | null = null;

  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }

  update(current: number): number {
    if (this.value === null) {
      this.value = current;
    } else {
      this.value = this.alpha * current + (1.0 - this.alpha) * this.value;
    }
    return this.value;
  }

  reset(): void {
    this.value = null;
  }
}

export class ExerciseEngine {
  public readonly exerciseType: ExerciseType;
  private filter: ExponentialFilter;
  private state: ExerciseState = 'readyUp';
  private repCounter: number = 0;
  private currentErrors: string[] = [];
  private repHadError: boolean = false;

  constructor(exerciseType: ExerciseType) {
    this.exerciseType = exerciseType;
    this.filter = new ExponentialFilter(0.3);
  }

  get reps(): number {
    return this.repCounter;
  }

  get currentState(): ExerciseState {
    return this.state;
  }

  reset(): void {
    this.state = 'readyUp';
    this.repCounter = 0;
    this.currentErrors = [];
    this.repHadError = false;
    this.filter.reset();
  }

  processLandmarks(
    landmarksInput: Record<string, LandmarkPoint> | LandmarkPoint[]
  ): AnalysisResult {
    const landmarks: Record<string, LandmarkPoint> = Array.isArray(landmarksInput)
      ? this.arrayToMap(landmarksInput)
      : landmarksInput;

    const points = this.resolveSidePoints(landmarks);
    if (Object.keys(points).length === 0) {
      return {
        reps: this.repCounter,
        phase: 'invalid',
        feedback: 'Ajusta la cámara para ver tu cuerpo completo',
        isFormCorrect: true,
        primaryAngle: 0.0,
        errors: [],
        repCompleted: false,
        trackingValid: false,
      };
    }

    const rawAngle = this.computePrimaryAngle(points);
    const angle = this.filter.update(rawAngle);

    const repFinished = this.updateFsm(angle);

    const errors = this.evaluateRules(points, angle);
    if (errors.length > 0) {
      this.repHadError = true;
      for (const err of errors) {
        if (!this.currentErrors.includes(err)) {
          this.currentErrors.push(err);
        }
      }
    }

    let feedback = this.getDefaultFeedback(this.state);
    if (errors.length > 0) {
      feedback = errors[0];
    } else if (repFinished) {
      feedback = this.repHadError
        ? `Rep ${this.repCounter} completada con detalles a mejorar`
        : '¡Repetición perfecta!';
    }

    return {
      reps: this.repCounter,
      phase: this.state,
      feedback,
      isFormCorrect: errors.length === 0,
      primaryAngle: parseFloat(angle.toFixed(1)),
      errors,
      repCompleted: repFinished,
      trackingValid: true,
    };
  }

  private arrayToMap(arr: LandmarkPoint[]): Record<string, LandmarkPoint> {
    const map: Record<string, LandmarkPoint> = {};
    for (let i = 0; i < arr.length; i++) {
      const name = LANDMARK_INDEX_MAP[i];
      if (name && arr[i]) {
        map[name] = arr[i];
      }
    }
    return map;
  }

  private resolveSidePoints(landmarks: Record<string, LandmarkPoint>): Record<string, [number, number]> {
    const resolved: Record<string, [number, number]> = {};
    const sidePairs: Record<string, [string, string]> = {
      shoulder: ['left_shoulder', 'right_shoulder'],
      elbow: ['left_elbow', 'right_elbow'],
      wrist: ['left_wrist', 'right_wrist'],
      hip: ['left_hip', 'right_hip'],
      knee: ['left_knee', 'right_knee'],
      ankle: ['left_ankle', 'right_ankle'],
    };

    for (const [key, [leftKey, rightKey]] of Object.entries(sidePairs)) {
      const left = landmarks[leftKey];
      const right = landmarks[rightKey];

      let best: LandmarkPoint | undefined;
      if (left && right) {
        const leftVis = left.visibility ?? 1.0;
        const rightVis = right.visibility ?? 1.0;
        best = leftVis >= rightVis ? left : right;
      } else {
        best = left ?? right;
      }

      if (best && (best.visibility ?? 1.0) >= 0.25) {
        resolved[key] = [best.x, best.y];
        if (left) resolved[leftKey] = [left.x, left.y];
        if (right) resolved[rightKey] = [right.x, right.y];
      }
    }

    return resolved;
  }

  private computePrimaryAngle(p: Record<string, [number, number]>): number {
    switch (this.exerciseType) {
      case 'squat':
      case 'bulgarianSquat':
        if (p.hip && p.knee && p.ankle) {
          return VectorMath.calculateAngle(p.hip, p.knee, p.ankle);
        }
        return 170.0;

      case 'bicepCurl':
      case 'tricepExtension':
      case 'singleArmRow':
        if (p.shoulder && p.elbow && p.wrist) {
          return VectorMath.calculateAngle(p.shoulder, p.elbow, p.wrist);
        }
        return 160.0;

      case 'shoulderPress':
        if (p.hip && p.shoulder && p.elbow) {
          return VectorMath.calculateAngle(p.hip, p.shoulder, p.elbow);
        }
        return 90.0;

      case 'abdominals':
      case 'gluteKickback':
        if (p.shoulder && p.hip && p.knee) {
          return VectorMath.calculateAngle(p.shoulder, p.hip, p.knee);
        }
        return 140.0;
    }
  }

  private updateFsm(angle: number): boolean {
    switch (this.exerciseType) {
      case 'squat':
      case 'bulgarianSquat':
        return this.stepFsm(angle, 150.0, 95.0, 105.0, 165.0, true, 165.0);

      case 'bicepCurl':
        return this.stepFsm(angle, 140.0, 65.0, 75.0, 150.0, true, 150.0);

      case 'shoulderPress':
        return this.stepFsm(angle, 110.0, 153.0, 145.0, 95.0, false);

      case 'abdominals':
        return this.stepFsm(angle, 130.0, 105.0, 115.0, 135.0, true, 140.0);

      case 'gluteKickback':
        return this.stepFsm(angle, 125.0, 150.0, 140.0, 115.0, false, 105.0);

      case 'tricepExtension':
        return this.stepFsm(angle, 130.0, 75.0, 85.0, 145.0, true, 150.0);

      case 'singleArmRow':
        return this.stepFsm(angle, 140.0, 85.0, 95.0, 155.0, true, 160.0);
    }
  }

  private stepFsm(
    angle: number,
    descendThresh: number,
    bottomThresh: number,
    ascendThresh: number,
    completeThresh: number,
    decreaseOnDescent: boolean,
    abortThresh?: number
  ): boolean {
    switch (this.state) {
      case 'readyUp': {
        const start = decreaseOnDescent ? angle < descendThresh : angle > descendThresh;
        if (start) {
          this.state = 'descending';
          this.currentErrors = [];
          this.repHadError = false;
        }
        break;
      }
      case 'descending': {
        if (abortThresh !== undefined) {
          const abort = decreaseOnDescent ? angle > abortThresh : angle < abortThresh;
          if (abort) {
            this.state = 'readyUp';
            return false;
          }
        }
        const hitBottom = decreaseOnDescent ? angle <= bottomThresh : angle >= bottomThresh;
        if (hitBottom) {
          this.state = 'bottom';
        }
        break;
      }
      case 'bottom': {
        const returning = decreaseOnDescent ? angle > ascendThresh : angle < ascendThresh;
        if (returning) {
          this.state = 'ascending';
        }
        break;
      }
      case 'ascending': {
        const complete = decreaseOnDescent ? angle >= completeThresh : angle <= completeThresh;
        if (complete) {
          this.state = 'readyUp';
          this.repCounter++;
          return true;
        }
        break;
      }
      case 'invalid':
        this.state = 'readyUp';
        break;
    }
    return false;
  }

  private evaluateRules(p: Record<string, [number, number]>, primaryAngle: number): string[] {
    const errors: string[] = [];

    switch (this.exerciseType) {
      case 'squat':
        if (this.state === 'bottom') {
          if (p.hip && p.knee) {
            const hipY = p.hip[1];
            const kneeY = p.knee[1];
            if (hipY < kneeY - 0.04 && primaryAngle > 95.0) {
              errors.push('⬇ Baja más: rompe el paralelo de las rodillas');
            }
          }
        }
        if (this.state === 'descending' || this.state === 'ascending') {
          if (p.shoulder && p.hip) {
            const lean = VectorMath.calculateTorsoLean(p.shoulder, p.hip);
            if (lean > 45.0) {
              errors.push('🔙 Mantén el pecho erguido, evita inclinarte');
            }
          }
        }
        break;

      case 'bicepCurl':
        if (this.state === 'ascending') {
          if (p.shoulder && p.hip) {
            const lean = VectorMath.calculateTorsoLean(p.shoulder, p.hip);
            if (lean > 15.0) {
              errors.push('No balancees el torso, usa solo el bíceps');
            }
          }
        }
        break;

      case 'shoulderPress':
        if (this.state === 'bottom' && primaryAngle < 153.0) {
          errors.push('⬆Extiende los brazos completamente al subir');
        }
        break;

      case 'abdominals':
        if (this.state === 'bottom' && primaryAngle > 110.0) {
          errors.push('Eleva más el tronco contrayendo el abdomen');
        }
        break;

      case 'gluteKickback':
        if (this.state === 'bottom' && primaryAngle < 145.0) {
          errors.push('Extiende la pierna más atrás apretando el glúteo');
        }
        break;

      case 'bulgarianSquat':
        if (this.state === 'bottom' && primaryAngle > 100.0) {
          errors.push('⬇Desciende hasta que el muslo quede paralelo');
        }
        break;

      case 'tricepExtension':
        if (this.state === 'bottom' && primaryAngle > 85.0) {
          errors.push('Flexiona más los codos hacia atrás');
        }
        break;

      case 'singleArmRow':
        if (this.state === 'bottom' && primaryAngle > 95.0) {
          errors.push('Sube el codo pegado al torso hacia la cadera');
        }
        break;
    }

    return errors;
  }

  private getDefaultFeedback(state: ExerciseState): string {
    switch (state) {
      case 'readyUp':
        return 'En posición. Inicia el movimiento.';
      case 'descending':
        return 'Movimiento controlado...';
      case 'bottom':
        return '¡Punto máximo! Sostén y regresa.';
      case 'ascending':
        return 'Subiendo con fuerza...';
      case 'invalid':
        return 'Ajusta la cámara para ver tu cuerpo';
    }
  }
}
