"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupHighlights = exports.sortByDepth = exports.refineRangeBoundaries = exports.unique = exports.defaults = exports.haveSameColor = void 0;
var config_1 = require("./config");
var dom_1 = require("./dom");
/**
 * Returns true if elements a i b have the same color.
 * @param {Node} a
 * @param {Node} b
 * @returns {boolean}
 */
function haveSameColor(a, b) {
    return dom_1.dom(a).color() === dom_1.dom(b).color();
}
exports.haveSameColor = haveSameColor;
/**
 * Fills undefined values in obj with default properties with the same name from source object.
 * @param {object} obj - target object
 * @param {object} source - source object with default values
 * @returns {object}
 */
function defaults(obj, source) {
    obj = obj || {};
    for (var prop in source) {
        if (Object.prototype.hasOwnProperty.call(source, prop) && obj[prop] === void 0) {
            obj[prop] = source[prop];
        }
    }
    return obj;
}
exports.defaults = defaults;
/**
 * Returns array without duplicated values.
 * @param {Array} arr
 * @returns {Array}
 */
function unique(arr) {
    return arr.filter(function (value, idx, self) { return self.indexOf(value) === idx; });
}
exports.unique = unique;
/**
 * Takes range object as parameter and refines it boundaries
 * @param range
 * @returns {object} refined boundaries and initial state of highlighting algorithm.
 */
function refineRangeBoundaries(range) {
    var startContainer = range.startContainer, endContainer = range.endContainer, ancestor = range.commonAncestorContainer, goDeeper = true;
    if (range.endOffset === 0) {
        while (!endContainer.previousSibling && endContainer.parentNode !== ancestor) {
            endContainer = endContainer.parentNode;
        }
        endContainer = endContainer.previousSibling;
    }
    else if (endContainer.nodeType === config_1.NODE_TYPE.TEXT_NODE) {
        if (range.endOffset < endContainer.nodeValue.length) {
            endContainer.splitText(range.endOffset);
        }
    }
    else if (range.endOffset > 0) {
        endContainer = endContainer.childNodes.item(range.endOffset - 1);
    }
    if (startContainer.nodeType === config_1.NODE_TYPE.TEXT_NODE) {
        if (range.startOffset === startContainer.nodeValue.length) {
            goDeeper = false;
        }
        else if (range.startOffset > 0) {
            startContainer = startContainer.splitText(range.startOffset);
            if (endContainer === startContainer.previousSibling) {
                endContainer = startContainer;
            }
        }
    }
    else if (range.startOffset < startContainer.childNodes.length) {
        startContainer = startContainer.childNodes.item(range.startOffset);
    }
    else {
        startContainer = startContainer.nextSibling;
    }
    return {
        startContainer: startContainer,
        endContainer: endContainer,
        goDeeper: goDeeper
    };
}
exports.refineRangeBoundaries = refineRangeBoundaries;
/**
 * Sorts array of DOM elements by its depth in DOM tree.
 * @param {HTMLElement[]} arr - array to sort.
 * @param {boolean} descending - order of sort.
 */
function sortByDepth(arr, descending) {
    arr.sort(function (a, b) {
        return dom_1.dom(descending ? b : a).parents().length - dom_1.dom(descending ? a : b).parents().length;
    });
}
exports.sortByDepth = sortByDepth;
/**
 * Groups given highlights by timestamp.
 * @param {Array} highlights
 * @returns {Array} Grouped highlights.
 */
function groupHighlights(highlights) {
    var order = [], chunks = {}, grouped = [];
    highlights.forEach(function (hl) {
        var timestamp = hl.getAttribute(config_1.TIMESTAMP_ATTR);
        if (typeof chunks[timestamp] === 'undefined') {
            chunks[timestamp] = [];
            order.push(timestamp);
        }
        chunks[timestamp].push(hl);
    });
    order.forEach(function (timestamp) {
        var group = chunks[timestamp];
        grouped.push({
            chunks: group,
            timestamp: timestamp,
            toString: function () {
                return group.map(function (h) {
                    return h.textContent;
                }).join('');
            }
        });
    });
    return grouped;
}
exports.groupHighlights = groupHighlights;
