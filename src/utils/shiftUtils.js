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
    // Since backend config uses useUTC: false, the database time is properly converted to the server's local time,
    // and serialized as a correct UTC ISO string in JSON. We can just parse it directly.
    return new Date(timeStr);
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

/**
 * Checks if a given date falls into the defined rest/prep times.
 * Rules for Shift 1 (08:00 - 20:00):
 * - 08:00 - 08:15 (Prep)
 * - 10:00 - 10:15 (Rest)
 * - 12:00 - 13:00 (Rest)
 * - 15:00 - 15:15 (Rest)
 * - 17:00 - 17:30 (Rest)
 * 
 * Rules for Shift 2 (20:00 - 08:00) apply the same offsets:
 * - 20:00 - 20:15
 * - 22:00 - 22:15
 * - 00:00 - 01:00
 * - 03:00 - 03:15
 * - 05:00 - 05:30
 * 
 * @param {Date} date - The date to check
 * @returns {boolean}
 */
export const checkIsRestTime = (date) => {
    const h = date.getHours() % 12;
    const m = date.getMinutes();
    
    if (h === 8 && m < 15) return true;
    if (h === 10 && m < 15) return true;
    if (h === 0) return true; // 12:00-12:59 and 00:00-00:59
    if (h === 3 && m < 15) return true; // 15:00-15:15 and 03:00-03:15
    if (h === 5 && m < 30) return true; // 17:00-17:30 and 05:00-05:30
    
    return false;
};

/**
 * Calculates the number of valid (non-rest) minutes elapsed since the start of the shift.
 * 
 * @param {Date} shiftStart - Start of the shift
 * @param {Date} now - Current time
 * @returns {number} Number of valid minutes
 */
export const getValidElapsedMinutes = (shiftStart, now) => {
    let validMinutes = 0;
    let current = new Date(shiftStart);
    current.setSeconds(0, 0);
    
    const end = new Date(now);
    end.setSeconds(0, 0);

    // Prevent calculating for future dates
    if (end < current) return 0;

    while (current < end) {
        if (!checkIsRestTime(current)) {
            validMinutes++;
        }
        current.setMinutes(current.getMinutes() + 1);
    }
    
    return validMinutes;
};
