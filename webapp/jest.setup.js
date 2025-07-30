// jest.setup.js

import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

if (typeof performance.mark !== 'function') {
  performance.mark = () => {};
}
if (typeof performance.clearMarks !== 'function') {
  performance.clearMarks = () => {};
}
if (typeof performance.measure !== 'function') {
  performance.measure = () => {};
}
if (typeof performance.clearMeasures !== 'function') {
  performance.clearMeasures = () => {};
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: jest.fn(), 
    removeListener: jest.fn(), 
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}

beforeEach(() => {
  fetchMock.resetMocks();
});
