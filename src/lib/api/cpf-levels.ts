// Re-export from modules for easy access
export { cpfLevelsApi } from "./modules/cpf-levels";

// Inline test for the re-export (only runs in test environment)
if (process.env.NODE_ENV?.includes('test')) {
  test('cpfLevelsApi is defined', () => {
    const { cpfLevelsApi } = require('./cpf-levels');
    expect(cpfLevelsApi).toBeDefined();
  });
}
