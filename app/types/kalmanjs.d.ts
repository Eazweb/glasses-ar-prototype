declare module "kalmanjs" {
  export default class KalmanFilter {
    constructor(options?: { R?: number; Q?: number });
    filter(value: number): number;
    lastMeasurement: number;
  }
}
