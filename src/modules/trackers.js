// let inverseDrawn = false;
// const toggleInverseDrawn = () => inverseDrawn = !inverseDrawn;
// let drawInverse = false;
// const toggledrawInverse = () => drawInverse = !drawInverse
// let i = 2;

export const makeCounter = (number) => {
  let counter = number;
  const changeBy = (val) => (counter += val);
  const setValue = (val) => (counter = val);
  return {
    increment() {
      changeBy(1);
    },
    reset() {
      setValue(number);
    },
    value() {
      return counter;
    },
  };
};

export const trackBoolean = (boolean) => {
  let booleanValue = boolean;
  const setBoolean = (val) => (booleanValue = val);
  return {
    setTrue() {
      setBoolean(true);
    },
    setFalse() {
      setBoolean(false);
    },
    value() {
      return booleanValue;
    },
  };
};
