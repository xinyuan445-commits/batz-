/**
 * Utility functions for shift calculation and time handling
 */

/**
 * Calculates the start and end time of the current shift based on the current time.
 * Shift definitions:
 * - Day Shift: 08:00 - 20:00
 * - Night Shift: 20:00 - 08:00 (Next Day)
 * 
 * @param {Date} now - The current date object (optional, defaults to now)
 * @returns {Object} { start: Date, end: Date }
 */
export const getShiftRange = (now = new Date()) => {
    const currentHour = now.getHours();
    let start = new Date(now);
    let end = new Date(now);

    // Day Shift: 08:00 - 20:00
    if (currentHour >= 8 && currentHour < 20) {
        start.setHours(8, 0, 0, 0);
        end.setHours(20, 0, 0, 0);
    } else {
        // Night Shift: 20:00 - 08:00
        if (currentHour >= 20) {
            // Case 1: After 20:00 (e.g., 21:00) -> Shift started today 20:00, ends tomorrow 08:00
            start.setHours(20, 0, 0, 0);
            end.setDate(end.getDate() + 1);
            end.setHours(8, 0, 0, 0);
        } else {
            // Case 2: Before 08:00 (e.g., 05:00) -> Shift started yesterday 20:00, ends today 08:00
            start.setDate(start.getDate() - 1);
            start.setHours(20, 0, 0, 0);
            end.setHours(8, 0, 0, 0);
        }
    }
    return { start, end };
};

/**
 * Parses a database time string, handling the timezone 'Z' suffix issue.
 * If the string ends with 'Z', it strips it to force local time interpretation
 * (assuming the DB string represents local time but has an incorrect Z suffix).
 * 
 * @param {string} timeStr - The time string from database
 * @returns {Date} Parsed Date object
 */
export const parseDbTime = (timeStr) => {
    if (!timeStr) return new Date();
    // Fix timezone issue: strip 'Z' to force local time interpretation
    const cleanStr = timeStr.endsWith('Z') ? timeStr.slice(0, -1) : timeStr;
    return new Date(cleanStr);
};

/**
 * Checks if a record falls within the current shift
 * 
 * @param {string} recordTimeStr - The record's CreatedTime string
 * @param {Date} shiftStart - Start of the shift
 * @param {Date} shiftEnd - End of the shift
 * @returns {boolean}
 */
export const isInCurrentShift = (recordTimeStr, shiftStart, shiftEnd) => {
    const recordTime = parseDbTime(recordTimeStr);
    return recordTime >= shiftStart && recordTime < shiftEnd;
};
