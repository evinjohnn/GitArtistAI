// src/pattern-processor.js
import { readFile } from 'fs/promises';

/**
 * Loads and parses a user-provided pixel art template file.
 * The file must be a JSON file with a "pixels" key.
 * The "pixels" key should contain an array of [week, day, density] arrays.
 * @param {string} filePath - The path to the user's template file.
 * @returns {Promise<Array<[number, number, number]>>} A promise that resolves to the pixel data.
 */
export async function loadPixelsFromFile(filePath) {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.pixels || !Array.isArray(data.pixels)) {
      throw new Error('Invalid template format: The JSON file must have a "pixels" key containing an array.');
    }

    // Optional: Add more validation for each pixel array if needed.

    return data.pixels;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found at path: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in file: ${filePath}. Please check the file for syntax errors.`);
    }
    throw error;
  }
}