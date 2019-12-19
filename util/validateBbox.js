'use strict';

/**
 * Accepts a bbox as a string or array, and validates (naive with regards to the Antimeridian)
 *
 * @private
 *
 * @param {Array|string} bboxInput Array in the format [minX,minY,maxX,maxY] or string in the format minX,minY,maxX,maxY
 * @returns {string} String in the format minX,minY,maxX,maxY
 */
function validateBbox(bboxInput) {

    if (!bboxInput) throw new Error('bbox must not be empty, must be minX,minY,maxX,maxY');
    if (!(typeof bboxInput == 'string' || Array.isArray(bboxInput))) {
        throw new Error('bbox must be a string in the format minX,minY,maxX,maxY or Array in the format [minX,minY,maxX,maxY]');
    }

    let bbox = Array.isArray(bboxInput) ? bboxInput : bboxInput.split(',');

    if (bbox.length !== 4) throw new Error('bbox must have four items in the format minX,minY,maxX,maxY or [minX,minY,maxX,maxY]');

    // Convert string coordinates to numbers
    bbox = bbox.map(Number);

    // check if valid bbox
    // TODO: handle crossing the Antimeridian
    if (isNaN(bbox[0]) || bbox[0] < -180 || bbox[0] > 180)
        throw new Error('bbox minX value must be a number between -180 and 180');
    if (isNaN(bbox[1]) || bbox[1] < -90 || bbox[1] > 90)
        throw new Error('bbox minY value must be a number between -90 and 90');
    if (isNaN(bbox[2]) || bbox[2] < -180 || bbox[2] > 180)
        throw new Error('bbox maxX value must be a number between -180 and 180');
    if (isNaN(bbox[3]) || bbox[3] < -90 || bbox[3] > 90)
        throw new Error('bbox maxY value must be a number between -90 and 90');
    if (bbox[0] > bbox[2])
        throw new Error('bbox minX value cannot be greater than maxX value');
    if (bbox[1] > bbox[3])
        throw new Error('bbox minY value cannot be greater than maxY value');

    return bbox.join();
}


module.exports = validateBbox;
