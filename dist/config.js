"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_TYPE = exports.IGNORE_TAGS = exports.TIMESTAMP_ATTR = exports.DATA_ATTR = void 0;
/**
 * Attribute added by default to every highlight.
 * @type {string}
 */
exports.DATA_ATTR = 'data-highlighted';
/**
 * Attribute used to group highlight wrappers.
 * @type {string}
 */
exports.TIMESTAMP_ATTR = 'data-timestamp';
/**
 * Don't highlight content of these tags.
 * @type {string[]}
 */
exports.IGNORE_TAGS = [
    'SCRIPT', 'STYLE', 'SELECT', 'OPTION', 'BUTTON', 'OBJECT', 'APPLET', 'VIDEO', 'AUDIO', 'CANVAS', 'EMBED', 'PARAM', 'METER', 'PROGRESS'
];
exports.NODE_TYPE = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3
};
