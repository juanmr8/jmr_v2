// Projects without real imagery yet (empty `images`) still render as a looping
// gallery of flat-color planes tinted with the project's `color`. This is how
// many frames make up one loop cycle — enough to fill the column and read as a
// real strip. Gallery and mini-map share it so their loop geometry stays in sync.
export const PLACEHOLDER_FRAME_COUNT = 5;
