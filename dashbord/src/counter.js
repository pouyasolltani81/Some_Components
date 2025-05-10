export function setupCounter(element) {
  let counter = 0
  const setCounter = (count) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}



export class Calculator {
  constructor() {
      this.result = 0;
  }

  // Basic arithmetic operations
  add(a, b) {
      return a + b;
  }

  subtract(a, b) {
      return a - b;
  }

  multiply(a, b) {
      return a * b;
  }
  modulo(dividend, divisor) {
      if (divisor === 0) {
          throw new Error('Modulo by zero is not allowed');
      }
      return dividend % divisor;
  }

  divide(a, b) {
      if (b === 0) {
          throw new Error('Division by zero is not allowed');
      }
      return a / b;
  }

  // Additional operations
  power(base, exponent) {
      return Math.pow(base, exponent);
  }

  squareRoot(number) {
      if (number < 0) {
          throw new Error('Cannot calculate square root of negative number');
      }
      return Math.sqrt(number);
  }

  percentage(number) {
      return number / 100;
  }

  // Memory operations
  clear() {
      this.result = 0;
      return this.result;
  }

  getResult() {
      return this.result;
  }

  setResult(value) {
      this.result = value;
      return this.result;
  }

  // Advanced operations
  factorial(n) {
      if (n < 0) {
          throw new Error('Factorial is not defined for negative numbers');
      }
      if (n === 0 || n === 1) {
          return 1;
      }
      return n * this.factorial(n - 1);
  }

  absolute(number) {
      return Math.abs(number);
  }

  round(number, decimals = 0) {
      return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
  }
}

export function printName(name) {
    if (!name) {
        throw new Error('Name cannot be empty');
    }
    return `Hello, ${name}!`;
}


