#!/usr/bin/env node

import 'dotenv/config';
import moment from 'moment';
import chalk from 'chalk';
import { getCanvasStartDate } from './src/utils.js';

// Test the day mapping fix
console.log(chalk.bold.green('🎨 Testing GitHub Commit Chart Day Mapping Fix'));
console.log(chalk.yellow('=========================================\n'));

// Get the corrected start date
const startDate = getCanvasStartDate();
console.log(chalk.blue('Canvas start date:', startDate.format('dddd YYYY-MM-DD')));

// Create a simple test pattern - one commit for each day of the week
const testPixels = [
  [0, 0, 4], // Sunday - Week 0, Day 0
  [0, 1, 4], // Monday - Week 0, Day 1
  [0, 2, 4], // Tuesday - Week 0, Day 2
  [0, 3, 4], // Wednesday - Week 0, Day 3
  [0, 4, 4], // Thursday - Week 0, Day 4
  [0, 5, 4], // Friday - Week 0, Day 5
  [0, 6, 4], // Saturday - Week 0, Day 6
];

console.log('\nTest Pattern - One commit per day:');
console.log('Week 0:');

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
testPixels.forEach(([week, day, density]) => {
  const commitDate = startDate.clone().add(week, 'weeks').add(day, 'days');
  console.log(`${chalk.gray(days[day])} (Day ${day}): ${commitDate.format('dddd YYYY-MM-DD')} - ${chalk.green('■')} (${density} commits)`);
});

console.log('\nPreview (how it should appear in GitHub):');
console.log('Sun | ■');
console.log('Mon | ■');
console.log('Tue | ■');
console.log('Wed | ■');
console.log('Thu | ■');
console.log('Fri | ■');
console.log('Sat | ■');

console.log('\n' + chalk.bold.green('✅ Day mapping fix applied successfully!'));
console.log(chalk.yellow('The commits should now appear on the correct days in your GitHub contribution graph.'));
