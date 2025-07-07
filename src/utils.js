// src/utils.js
import moment from 'moment';

/**
 * Calculates the precise start date for the GitHub contribution graph.
 * This function replicates GitHub's actual behavior: shows the past 53 weeks
 * starting from the Sunday of the week that was 53 weeks ago.
 * @returns {moment.Moment} A moment.js object representing the start date.
 */
export function getCanvasStartDate() {
  const today = moment();
  // GitHub shows contributions for the past ~53 weeks
  const weeksToShow = 53;
  const startOfPeriod = today.clone().subtract(weeksToShow, 'weeks');
  // GitHub starts counting from the Sunday of the week that contains the date 53 weeks ago
  const startDate = startOfPeriod.startOf('week');
  
  return startDate;
}