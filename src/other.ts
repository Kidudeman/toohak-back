import { getData, setData } from './dataStore';

/**
 * Clears or resets the state.
 *
 * @returns {Object} - An empty object indicating the state has been cleared or reset.
 */
export function clear(): Record<string, never> {
  const clearData = getData();
  clearData.users = [];
  clearData.quizzes = [];
  clearData.trash = [];
  clearData.activeUsers = [];
  clearData.activePlayers = [];
  clearData.quizSessions = [];
  setData(clearData);
  return {};
}
