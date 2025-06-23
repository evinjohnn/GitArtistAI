// src/utils.js
import moment from 'moment';

/**
 * Calculates the precise start date for the GitHub contribution graph.
 * This function replicates the logic from gitfiti.py to find the first
 * Sunday of the 52-week block shown on a GitHub profile.
 * @returns {moment.Moment} A moment.js object representing the start date.
 */
export function getCanvasStartDate() {
  const today = moment();
  // GitHub's graph shows ~52-53 weeks. We go back 1 year to get into the right timeframe.
  const oneYearAgo = today.clone().subtract(1, 'year');

  // We need to find the most recent Sunday that is at least one year ago.
  // We move `oneYearAgo` to the beginning of its week (Sunday).
  const startDate = oneYearAgo.startOf('week');

  return startDate;
}