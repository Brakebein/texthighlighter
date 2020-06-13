import {defaults, groupHighlights, haveSameColor, refineRangeBoundaries, sortByDepth, unique} from './utils';
import {bindEvents, unbindEvents} from './events';
import {dom} from './dom';
import {DATA_ATTR, IGNORE_TAGS, NODE_TYPE, TIMESTAMP_ATTR} from './config';

/**
 * @class TextHighlighter
 */
export class TextHighlighter {

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
  constructor(element, options = {}) {
    if (!element) {
      throw 'Missing anchor element';
    }

    this.el = element;
    this.options = defaults(options, {
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

    dom(this.el).addClass(this.options.contextClass);
    bindEvents(this.el, this);
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
  static createWrapper(options) {
    const span = document.createElement('span');
    span.style.backgroundColor = options.color;
    span.className = options.highlightedClass;
    return span;
  }

  /**
   * Permanently disables highlighting.
   * Unbinds events and remove context element class.
   */
  destroy() {
    unbindEvents(this.el, this);
    dom(this.el).removeClass(this.options.contextClass);
  }

  highlightHandler() {
    this.doHighlight();
  }

  /**
   * Highlights current range.
   * @param {boolean} keepRange - Don't remove range after highlighting. Default: false.
   */
  doHighlight(keepRange = false) {
    const range = dom(this.el).getRange();

    if (!range || range.collapsed) {
      return;
    }

    if (this.options.onBeforeHighlight(range) === true) {
      const timestamp = +new Date();
      const wrapper = TextHighlighter.createWrapper(this.options);
      wrapper.setAttribute(TIMESTAMP_ATTR, timestamp.toString());

      const createdHighlights = this.highlightRange(range, wrapper);
      const normalizedHighlights = this.normalizeHighlights(createdHighlights);

      this.options.onAfterHighlight(range, normalizedHighlights, timestamp);
    }

    if (!keepRange) {
      dom(this.el).removeAllRanges();
    }
  }

  /**
   * Highlights range.
   * Wraps text of given range object in wrapper element.
   * @param {Range} range
   * @param {HTMLElement} wrapper
   * @returns {Array} - array of created highlights.
   */
  highlightRange(range, wrapper) {
    if (!range || range.collapsed) {
      return [];
    }

    const result = refineRangeBoundaries(range),
      startContainer = result.startContainer,
      endContainer = result.endContainer,
      highlights = [];
    let goDeeper = result.goDeeper,
      done = false,
      node = startContainer,
      highlight,
      wrapperClone,
      nodeParent;

    do {
      if (goDeeper && node.nodeType === NODE_TYPE.TEXT_NODE) {

        if (IGNORE_TAGS.indexOf(node.parentNode.tagName) === -1 && node.nodeValue.trim() !== '') {
          wrapperClone = wrapper.cloneNode(true);
          wrapperClone.setAttribute(DATA_ATTR, true);
          nodeParent = node.parentNode;

          // highlight if a node is inside the el
          if (dom(this.el).contains(nodeParent) || nodeParent === this.el) {
            highlight = dom(node).wrap(wrapperClone);
            highlights.push(highlight);
          }
        }

        goDeeper = false;
      }
      if (node === endContainer && !(endContainer.hasChildNodes() && goDeeper)) {
        done = true;
      }

      if (node.tagName && IGNORE_TAGS.indexOf(node.tagName) > -1) {

        if (endContainer.parentNode === node) {
          done = true;
        }
        goDeeper = false;
      }
      if (goDeeper && node.hasChildNodes()) {
        node = node.firstChild;
      } else if (node.nextSibling) {
        node = node.nextSibling;
        goDeeper = true;
      } else {
        node = node.parentNode;
        goDeeper = false;
      }
    } while (!done);

    return highlights;
  }

  /**
   * Normalizes highlights. Ensures that highlighting is done with use of the smallest possible number of
   * wrapping HTML elements.
   * Flattens highlights structure and merges sibling highlights. Normalizes text nodes within highlights.
   * @param {Array} highlights - highlights to normalize.
   * @returns {Array} - array of normalized highlights. Order and number of returned highlights may be different than
   * input highlights.
   */
  normalizeHighlights(highlights) {
    this.flattenNestedHighlights(highlights);
    this.mergeSiblingHighlights(highlights);

    // omit removed nodes
    let normalizedHighlights = highlights.filter(hl => hl.parentElement ? hl : null);

    normalizedHighlights = unique(normalizedHighlights);
    normalizedHighlights.sort((a, b) => a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft);

    return normalizedHighlights;
  }

  /**
   * Flattens highlights structure.
   * Note: this method changes input highlights - their order and number after calling this method may change.
   * @param {Array} highlights - highlights to flatten.
   */
  flattenNestedHighlights(highlights) {
    sortByDepth(highlights, true);

    const flattenOnce = () => {
      let again = false;

      highlights.forEach((hl, i) => {
        const parent = hl.parentElement,
          parentPrev = parent.previousSibling,
          parentNext = parent.nextSibling;

        if (this.isHighlight(parent)) {

          if (!haveSameColor(parent, hl)) {

            if (!hl.nextSibling) {
              dom(hl).insertBefore(parentNext || parent);
              again = true;
            }

            if (!hl.previousSibling) {
              dom(hl).insertAfter(parentPrev || parent);
              again = true;
            }

            if (!parent.hasChildNodes()) {
              dom(parent).remove();
            }

          } else {
            parent.replaceChild(hl.firstChild, hl);
            highlights[i] = parent;
            again = true;
          }

        }

      });

      return again;
    };

    let again;

    do {
      again = flattenOnce();
    } while (again);
  }

  /**
   * Merges sibling highlights and normalizes descendant text nodes.
   * Note: this method changes input highlights - their order and number after calling this method may change.
   * @param highlights
   */
  mergeSiblingHighlights(highlights) {
    const shouldMerge = (current, node) => {
      return node && node.nodeType === NODE_TYPE.ELEMENT_NODE &&
        haveSameColor(current, node) &&
        this.isHighlight(node);
    };

    highlights.forEach(highlight => {
      const prev = highlight.previousSibling,
        next = highlight.nextSibling;

      if (shouldMerge(highlight, prev)) {
        dom(highlight).prepend(prev.childNodes);
        dom(prev).remove();
      }
      if (shouldMerge(highlight, next)) {
        dom(highlight).append(next.childNodes);
        dom(next).remove();
      }

      dom(highlight).normalizeTextNodes();
    });
  }

  /**
   * Sets highlighting color.
   * @param {string} color - valid CSS color.
   */
  setColor(color) {
    this.options.color = color;
  }

  /**
   * Returns highlighting color.
   * @returns {string}
   */
  getColor() {
    return this.options.color;
  }

  /**
   * Removes highlights from element. If element is a highlight itself, it is removed as well.
   * If no element is given, all highlights all removed.
   * @param {HTMLElement} [element] - element to remove highlights from
   */
  removeHighlights(element) {
    const container = element || this.el,
      highlights = this.getHighlights({container: container});

    sortByDepth(highlights, true);

    highlights.forEach(hl => {
      if (this.options.onRemoveHighlight(hl) === true) {
        const textNodes = dom(hl).unwrap();
        textNodes.forEach(textNode => {
          const prev = textNode.previousSibling,
            next = textNode.nextSibling;

          if (prev && prev.nodeType === NODE_TYPE.TEXT_NODE) {
            textNode.nodeValue = prev.nodeValue + textNode.nodeValue;
            dom(prev).remove();
          }
          if (next && next.nodeType === NODE_TYPE.TEXT_NODE) {
            textNode.nodeValue = textNode.nodeValue + next.nodeValue;
            dom(next).remove();
          }
        });
      }
    });
  }

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
  getHighlights(params= {}) {
    params = defaults(params, {
      container: this.el,
      andSelf: true,
      grouped: false
    });

    const nodeList = params.container.querySelectorAll('[' + DATA_ATTR + ']');
    let highlights = Array.prototype.slice.call(nodeList);

    if (params.andSelf === true && params.container.hasAttribute(DATA_ATTR)) {
      highlights.push(params.container);
    }

    if (params.grouped) {
      highlights = groupHighlights(highlights);
    }

    return highlights;
  }

  /**
   * Returns true if element is a highlight.
   * All highlights have 'data-highlighted' attribute.
   * @param el - element to check.
   * @returns {boolean}
   */
  isHighlight(el) {
    return el && el.nodeType === NODE_TYPE.ELEMENT_NODE && el.hasAttribute(DATA_ATTR);
  }

  /**
   * Serializes all highlights in the element the highlighter is applied to.
   * @returns {string} - stringified JSON with highlights definition
   */
  serializeHighlights() {
    const highlights = this.getHighlights(),
      refEl = this.el,
      hlDescriptors = [];

    const getElementPath = (el, refElement) => {
      const path = [];

      do {
        const childNodes = Array.prototype.slice.call(el.parentNode.childNodes);
        path.unshift(childNodes.indexOf(el));
        el = el.parentNode;
      } while (el !== refElement || !el);

      return path;
    };

    sortByDepth(highlights, false);

    highlights.forEach(function (highlight) {
      const length = highlight.textContent.length,
        hlPath = getElementPath(highlight, refEl),
        wrapper = highlight.cloneNode(true);
      let offset = 0; // Hl offset from previous sibling within parent node.

      wrapper.innerHTML = '';

      if (highlight.previousSibling && highlight.previousSibling.nodeType === NODE_TYPE.TEXT_NODE) {
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
  }

  /**
   * Deserializes highlights.
   * @throws exception when can't parse JSON or JSON has invalid structure.
   * @param {string} json - JSON string with highlights definition.
   * @returns {Array} - array of deserialized highlights.
   */
  deserializeHighlights(json) {
    var hlDescriptors,
      highlights = [],
      self = this;

    if (!json) {
      return highlights;
    }

    try {
      hlDescriptors = JSON.parse(json);
    } catch (e) {
      throw 'Can\'t parse JSON: ' + e;
    }

    const deserializationFn = (hlDescriptor) => {
      const hl = {
        wrapper: hlDescriptor[0],
        text: hlDescriptor[1],
        path: hlDescriptor[2].split(':'),
        offset: hlDescriptor[3],
        length: hlDescriptor[4]
      };
      let elIndex = hl.path.pop(),
        node = self.el,
        hlNode,
        highlight,
        idx;

      while ((idx = hl.path.shift())) {
        node = node.childNodes[idx];
      }

      if (node.childNodes[elIndex - 1] && node.childNodes[elIndex - 1].nodeType === NODE_TYPE.TEXT_NODE) {
        elIndex -= 1;
      }

      node = node.childNodes[elIndex];
      hlNode = node.splitText(hl.offset);
      hlNode.splitText(hl.length);

      if (hlNode.nextSibling && !hlNode.nextSibling.nodeValue) {
        dom(hlNode.nextSibling).remove();
      }

      if (hlNode.previousSibling && !hlNode.previousSibling.nodeValue) {
        dom(hlNode.previousSibling).remove();
      }

      highlight = dom(hlNode).wrap(dom().fromHTML(hl.wrapper)[0]);
      highlights.push(highlight);
    };

    hlDescriptors.forEach(function (hlDescriptor) {
      try {
        deserializationFn(hlDescriptor);
      } catch (e) {
        if (console && console.warn) {
          console.warn('Can\'t deserialize highlight descriptor. Cause: ' + e);
        }
      }
    });

    return highlights;
  }

  /**
   * Finds and highlights given text.
   * @param {string} text - text to search for
   * @param {boolean} [caseSensitive] - if set to true, performs case sensitive search (default: true)
   */
  find(text, caseSensitive) {
    const wnd = dom(this.el).getWindow(),
      scrollX = wnd.scrollX,
      scrollY = wnd.scrollY,
      caseSens = (typeof caseSensitive === 'undefined' ? true : caseSensitive);

    dom(this.el).removeAllRanges();

    if (wnd.find) {
      while (wnd.find(text, caseSens)) {
        this.doHighlight(true);
      }
    } else if (wnd.document.body.createTextRange) {
      const textRange = wnd.document.body.createTextRange();
      textRange.moveToElementText(this.el);
      while (textRange.findText(text, 1, caseSens ? 4 : 0)) {
        if (!dom(this.el).contains(textRange.parentElement()) && textRange.parentElement() !== this.el) {
          break;
        }

        textRange.select();
        this.doHighlight(true);
        textRange.collapse(false);
      }
    }

    dom(this.el).removeAllRanges();
    wnd.scrollTo(scrollX, scrollY);
  }
}
