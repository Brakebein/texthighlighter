"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextHighlighter = void 0;
var utils_1 = require("./utils");
var events_1 = require("./events");
var dom_1 = require("./dom");
var config_1 = require("./config");
/**
 * @class TextHighlighter
 */
var TextHighlighter = /** @class */ (function () {
    /**
     * Creates TextHighlighter instance and binds to given DOM elements.
     * @param {HTMLElement} element - DOM element to which highlighted will be applied.
     * @param {object} [options] - additional options.
     * @param {string=} options.color - highlight color.
     * @param {string=} options.highlightedClass - class added to highlight, 'highlighted' by default.
     * @param {string=} options.contextClass - class added to element to which highlighter is applied,
     *  'highlighter-context' by default.
     * @param {function=} options.onRemoveHighlight - function called before highlight is removed. Highlight is
     *  passed as param. Function should return true if highlight should be removed, or false - to prevent removal.
     * @param {function=} options.onBeforeHighlight - function called before highlight is created. Range object is
     *  passed as param. Function should return true to continue processing, or false - to prevent highlighting.
     * @param {function=} options.onAfterHighlight - function called after highlight is created. Array of created
     * wrappers is passed as param.
     */
    function TextHighlighter(element, options) {
        if (options === void 0) { options = {}; }
        if (!element) {
            throw 'Missing anchor element';
        }
        this.el = element;
        this.options = utils_1.defaults(options, {
            color: '#ffff7b',
            highlightedClass: 'highlighted',
            contextClass: 'highlighter-context',
            onRemoveHighlight: function () {
                return true;
            },
            onBeforeHighlight: function () {
                return true;
            },
            onAfterHighlight: function () {
            }
        });
        dom_1.dom(this.el).addClass(this.options.contextClass);
        events_1.bindEvents(this.el, this);
    }
    /**
     * Creates wrapper for highlights.
     * TextHighlighter instance calls this method each time it needs to create highlights and pass options retrieved
     * in constructor.
     * @param {object} options - the same object as in TextHighlighter constructor.
     * @returns {HTMLElement}
     * @memberof TextHighlighter
     * @static
     */
    TextHighlighter.createWrapper = function (options) {
        var span = document.createElement('span');
        span.style.backgroundColor = options.color;
        span.className = options.highlightedClass;
        return span;
    };
    /**
     * Permanently disables highlighting.
     * Unbinds events and remove context element class.
     */
    TextHighlighter.prototype.destroy = function () {
        events_1.unbindEvents(this.el, this);
        dom_1.dom(this.el).removeClass(this.options.contextClass);
    };
    TextHighlighter.prototype.highlightHandler = function () {
        this.doHighlight();
    };
    /**
     * Highlights current range.
     * @param {boolean} keepRange - Don't remove range after highlighting. Default: false.
     */
    TextHighlighter.prototype.doHighlight = function (keepRange) {
        if (keepRange === void 0) { keepRange = false; }
        var range = dom_1.dom(this.el).getRange();
        if (!range || range.collapsed) {
            return;
        }
        if (this.options.onBeforeHighlight(range) === true) {
            var timestamp = +new Date();
            var wrapper = TextHighlighter.createWrapper(this.options);
            wrapper.setAttribute(config_1.TIMESTAMP_ATTR, timestamp.toString());
            var createdHighlights = this.highlightRange(range, wrapper);
            var normalizedHighlights = this.normalizeHighlights(createdHighlights);
            this.options.onAfterHighlight(range, normalizedHighlights, timestamp);
        }
        if (!keepRange) {
            dom_1.dom(this.el).removeAllRanges();
        }
    };
    /**
     * Highlights range.
     * Wraps text of given range object in wrapper element.
     * @param {Range} range
     * @param {HTMLElement} wrapper
     * @returns {Array} - array of created highlights.
     */
    TextHighlighter.prototype.highlightRange = function (range, wrapper) {
        if (!range || range.collapsed) {
            return [];
        }
        var result = utils_1.refineRangeBoundaries(range), startContainer = result.startContainer, endContainer = result.endContainer, highlights = [];
        var goDeeper = result.goDeeper, done = false, node = startContainer, highlight, wrapperClone, nodeParent;
        do {
            if (goDeeper && node.nodeType === config_1.NODE_TYPE.TEXT_NODE) {
                if (config_1.IGNORE_TAGS.indexOf(node.parentNode.tagName) === -1 && node.nodeValue.trim() !== '') {
                    wrapperClone = wrapper.cloneNode(true);
                    wrapperClone.setAttribute(config_1.DATA_ATTR, true);
                    nodeParent = node.parentNode;
                    // highlight if a node is inside the el
                    if (dom_1.dom(this.el).contains(nodeParent) || nodeParent === this.el) {
                        highlight = dom_1.dom(node).wrap(wrapperClone);
                        highlights.push(highlight);
                    }
                }
                goDeeper = false;
            }
            if (node === endContainer && !(endContainer.hasChildNodes() && goDeeper)) {
                done = true;
            }
            if (node.tagName && config_1.IGNORE_TAGS.indexOf(node.tagName) > -1) {
                if (endContainer.parentNode === node) {
                    done = true;
                }
                goDeeper = false;
            }
            if (goDeeper && node.hasChildNodes()) {
                node = node.firstChild;
            }
            else if (node.nextSibling) {
                node = node.nextSibling;
                goDeeper = true;
            }
            else {
                node = node.parentNode;
                goDeeper = false;
            }
        } while (!done);
        return highlights;
    };
    /**
     * Normalizes highlights. Ensures that highlighting is done with use of the smallest possible number of
     * wrapping HTML elements.
     * Flattens highlights structure and merges sibling highlights. Normalizes text nodes within highlights.
     * @param {Array} highlights - highlights to normalize.
     * @returns {Array} - array of normalized highlights. Order and number of returned highlights may be different than
     * input highlights.
     */
    TextHighlighter.prototype.normalizeHighlights = function (highlights) {
        this.flattenNestedHighlights(highlights);
        this.mergeSiblingHighlights(highlights);
        // omit removed nodes
        var normalizedHighlights = highlights.filter(function (hl) { return hl.parentElement ? hl : null; });
        normalizedHighlights = utils_1.unique(normalizedHighlights);
        normalizedHighlights.sort(function (a, b) { return a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft; });
        return normalizedHighlights;
    };
    /**
     * Flattens highlights structure.
     * Note: this method changes input highlights - their order and number after calling this method may change.
     * @param {Array} highlights - highlights to flatten.
     */
    TextHighlighter.prototype.flattenNestedHighlights = function (highlights) {
        var _this = this;
        utils_1.sortByDepth(highlights, true);
        var flattenOnce = function () {
            var again = false;
            highlights.forEach(function (hl, i) {
                var parent = hl.parentElement, parentPrev = parent.previousSibling, parentNext = parent.nextSibling;
                if (_this.isHighlight(parent)) {
                    if (!utils_1.haveSameColor(parent, hl)) {
                        if (!hl.nextSibling) {
                            dom_1.dom(hl).insertBefore(parentNext || parent);
                            again = true;
                        }
                        if (!hl.previousSibling) {
                            dom_1.dom(hl).insertAfter(parentPrev || parent);
                            again = true;
                        }
                        if (!parent.hasChildNodes()) {
                            dom_1.dom(parent).remove();
                        }
                    }
                    else {
                        parent.replaceChild(hl.firstChild, hl);
                        highlights[i] = parent;
                        again = true;
                    }
                }
            });
            return again;
        };
        var again;
        do {
            again = flattenOnce();
        } while (again);
    };
    /**
     * Merges sibling highlights and normalizes descendant text nodes.
     * Note: this method changes input highlights - their order and number after calling this method may change.
     * @param highlights
     */
    TextHighlighter.prototype.mergeSiblingHighlights = function (highlights) {
        var _this = this;
        var shouldMerge = function (current, node) {
            return node && node.nodeType === config_1.NODE_TYPE.ELEMENT_NODE &&
                utils_1.haveSameColor(current, node) &&
                _this.isHighlight(node);
        };
        highlights.forEach(function (highlight) {
            var prev = highlight.previousSibling, next = highlight.nextSibling;
            if (shouldMerge(highlight, prev)) {
                dom_1.dom(highlight).prepend(prev.childNodes);
                dom_1.dom(prev).remove();
            }
            if (shouldMerge(highlight, next)) {
                dom_1.dom(highlight).append(next.childNodes);
                dom_1.dom(next).remove();
            }
            dom_1.dom(highlight).normalizeTextNodes();
        });
    };
    /**
     * Sets highlighting color.
     * @param {string} color - valid CSS color.
     */
    TextHighlighter.prototype.setColor = function (color) {
        this.options.color = color;
    };
    /**
     * Returns highlighting color.
     * @returns {string}
     */
    TextHighlighter.prototype.getColor = function () {
        return this.options.color;
    };
    /**
     * Removes highlights from element. If element is a highlight itself, it is removed as well.
     * If no element is given, all highlights all removed.
     * @param {HTMLElement} [element] - element to remove highlights from
     */
    TextHighlighter.prototype.removeHighlights = function (element) {
        var _this = this;
        var container = element || this.el, highlights = this.getHighlights({ container: container });
        utils_1.sortByDepth(highlights, true);
        highlights.forEach(function (hl) {
            if (_this.options.onRemoveHighlight(hl) === true) {
                var textNodes = dom_1.dom(hl).unwrap();
                textNodes.forEach(function (textNode) {
                    var prev = textNode.previousSibling, next = textNode.nextSibling;
                    if (prev && prev.nodeType === config_1.NODE_TYPE.TEXT_NODE) {
                        textNode.nodeValue = prev.nodeValue + textNode.nodeValue;
                        dom_1.dom(prev).remove();
                    }
                    if (next && next.nodeType === config_1.NODE_TYPE.TEXT_NODE) {
                        textNode.nodeValue = textNode.nodeValue + next.nodeValue;
                        dom_1.dom(next).remove();
                    }
                });
            }
        });
    };
    /**
     * Returns highlights from given container.
     * @param params
     * @param {HTMLElement} [params.container] - return highlights from this element. Default: the element the
     * highlighter is applied to.
     * @param {boolean} [params.andSelf] - if set to true and container is a highlight itself, add container to
     * returned results. Default: true.
     * @param {boolean} [params.grouped] - if set to true, highlights are grouped in logical groups of highlights added
     * in the same moment. Each group is an object which has got array of highlights, 'toString' method and 'timestamp'
     * property. Default: false.
     * @returns {Array} - array of highlights.
     */
    TextHighlighter.prototype.getHighlights = function (params) {
        if (params === void 0) { params = {}; }
        params = utils_1.defaults(params, {
            container: this.el,
            andSelf: true,
            grouped: false
        });
        var nodeList = params.container.querySelectorAll('[' + config_1.DATA_ATTR + ']');
        var highlights = Array.prototype.slice.call(nodeList);
        if (params.andSelf === true && params.container.hasAttribute(config_1.DATA_ATTR)) {
            highlights.push(params.container);
        }
        if (params.grouped) {
            highlights = utils_1.groupHighlights(highlights);
        }
        return highlights;
    };
    /**
     * Returns true if element is a highlight.
     * All highlights have 'data-highlighted' attribute.
     * @param el - element to check.
     * @returns {boolean}
     */
    TextHighlighter.prototype.isHighlight = function (el) {
        return el && el.nodeType === config_1.NODE_TYPE.ELEMENT_NODE && el.hasAttribute(config_1.DATA_ATTR);
    };
    /**
     * Serializes all highlights in the element the highlighter is applied to.
     * @returns {string} - stringified JSON with highlights definition
     */
    TextHighlighter.prototype.serializeHighlights = function () {
        var highlights = this.getHighlights(), refEl = this.el, hlDescriptors = [];
        var getElementPath = function (el, refElement) {
            var path = [];
            do {
                var childNodes = Array.prototype.slice.call(el.parentNode.childNodes);
                path.unshift(childNodes.indexOf(el));
                el = el.parentNode;
            } while (el !== refElement || !el);
            return path;
        };
        utils_1.sortByDepth(highlights, false);
        highlights.forEach(function (highlight) {
            var length = highlight.textContent.length, hlPath = getElementPath(highlight, refEl), wrapper = highlight.cloneNode(true);
            var offset = 0; // Hl offset from previous sibling within parent node.
            wrapper.innerHTML = '';
            if (highlight.previousSibling && highlight.previousSibling.nodeType === config_1.NODE_TYPE.TEXT_NODE) {
                offset = highlight.previousSibling.length;
            }
            hlDescriptors.push([
                wrapper.outerHTML,
                highlight.textContent,
                hlPath.join(':'),
                offset,
                length
            ]);
        });
        return JSON.stringify(hlDescriptors);
    };
    /**
     * Deserializes highlights.
     * @throws exception when can't parse JSON or JSON has invalid structure.
     * @param {string} json - JSON string with highlights definition.
     * @returns {Array} - array of deserialized highlights.
     */
    TextHighlighter.prototype.deserializeHighlights = function (json) {
        var hlDescriptors, highlights = [], self = this;
        if (!json) {
            return highlights;
        }
        try {
            hlDescriptors = JSON.parse(json);
        }
        catch (e) {
            throw 'Can\'t parse JSON: ' + e;
        }
        var deserializationFn = function (hlDescriptor) {
            var hl = {
                wrapper: hlDescriptor[0],
                text: hlDescriptor[1],
                path: hlDescriptor[2].split(':'),
                offset: hlDescriptor[3],
                length: hlDescriptor[4]
            };
            var elIndex = hl.path.pop(), node = self.el, hlNode, highlight, idx;
            while ((idx = hl.path.shift())) {
                node = node.childNodes[idx];
            }
            if (node.childNodes[elIndex - 1] && node.childNodes[elIndex - 1].nodeType === config_1.NODE_TYPE.TEXT_NODE) {
                elIndex -= 1;
            }
            node = node.childNodes[elIndex];
            hlNode = node.splitText(hl.offset);
            hlNode.splitText(hl.length);
            if (hlNode.nextSibling && !hlNode.nextSibling.nodeValue) {
                dom_1.dom(hlNode.nextSibling).remove();
            }
            if (hlNode.previousSibling && !hlNode.previousSibling.nodeValue) {
                dom_1.dom(hlNode.previousSibling).remove();
            }
            highlight = dom_1.dom(hlNode).wrap(dom_1.dom().fromHTML(hl.wrapper)[0]);
            highlights.push(highlight);
        };
        hlDescriptors.forEach(function (hlDescriptor) {
            try {
                deserializationFn(hlDescriptor);
            }
            catch (e) {
                if (console && console.warn) {
                    console.warn('Can\'t deserialize highlight descriptor. Cause: ' + e);
                }
            }
        });
        return highlights;
    };
    /**
     * Finds and highlights given text.
     * @param {string} text - text to search for
     * @param {boolean} [caseSensitive] - if set to true, performs case sensitive search (default: true)
     */
    TextHighlighter.prototype.find = function (text, caseSensitive) {
        var wnd = dom_1.dom(this.el).getWindow(), scrollX = wnd.scrollX, scrollY = wnd.scrollY, caseSens = (typeof caseSensitive === 'undefined' ? true : caseSensitive);
        dom_1.dom(this.el).removeAllRanges();
        if (wnd.find) {
            while (wnd.find(text, caseSens)) {
                this.doHighlight(true);
            }
        }
        else if (wnd.document.body.createTextRange) {
            var textRange = wnd.document.body.createTextRange();
            textRange.moveToElementText(this.el);
            while (textRange.findText(text, 1, caseSens ? 4 : 0)) {
                if (!dom_1.dom(this.el).contains(textRange.parentElement()) && textRange.parentElement() !== this.el) {
                    break;
                }
                textRange.select();
                this.doHighlight(true);
                textRange.collapse(false);
            }
        }
        dom_1.dom(this.el).removeAllRanges();
        wnd.scrollTo(scrollX, scrollY);
    };
    return TextHighlighter;
}());
exports.TextHighlighter = TextHighlighter;
