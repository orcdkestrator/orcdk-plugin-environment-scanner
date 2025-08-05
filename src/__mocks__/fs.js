module.exports = {
  readFileSync: jest.fn(() => JSON.stringify({ version: '1.0.0' })),
  promises: {
    readFile: jest.fn(),
  },
};