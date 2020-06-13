import {NODE_TYPE} from './config';

/**
 * Utility functions to make DOM manipulation easier.
 * @param {Node|HTMLElement} [el] - base DOM element to manipulate
 * @returns {object}
 */
export const dom = function (el) {

  return /** @lends dom **/ {

    /**
     * Adds class to element.
     * @param {string} className
     */
    addClass: function (className) {
      if (el.classList) {
        el.classList.add(className);
      } else {
        el.className += ' ' + className;
      }
    },

    /**
     * Removes class from element.
     * @param {string} className
     */
    removeClass: function (className) {
      if (el.classList) {
        el.classList.remove(className);
      } else {
        el.className = el.className.replace(
          new RegExp('(^|\\b)' + className + '(\\b|$)', 'gi'), ' '
        );
      }
    },

    /**
     * Prepends child nodes to base element.
     * @param {Node[]} nodesToPrepend
     */
    prepend: function (nodesToPrepend) {
      const nodes = Array.prototype.slice.call(nodesToPrepend);
      let i = nodes.length;

      while (i--) {
        el.insertBefore(nodes[i], el.firstChild);
      }
    },

    /**
     * Appends child nodes to base element.
     * @param {Node[]} nodesToAppend
     */
    append: function (nodesToAppend) {
      const nodes = Array.prototype.slice.call(nodesToAppend);

      for (let i = 0, len = nodes.length; i < len; ++i) {
        el.appendChild(nodes[i]);
      }
    },

    /**
     * Inserts base element after refEl.
     * @param {Node} refEl - node after which base element will be inserted
     * @returns {Node} - inserted element
     */
    insertAfter: function (refEl) {
      return refEl.parentNode.insertBefore(el, refEl.nextSibling);
    },

    /**
     * Inserts base element before refEl.
     * @param {Node} refEl - node before which base element will be inserted
     * @returns {Node} - inserted element
     */
    insertBefore: function (refEl) {
      return refEl.parentNode.insertBefore(el, refEl);
    },

    /**
     * Removes base element from DOM.
     */
    remove: function () {
      el.parentNode.removeChild(el);
      el = null;
    },

    /**
     * Returns true if base element contains given child.
     * @param {Node|HTMLElement} child
     * @returns {boolean}
     */
    contains: function (child) {
      return el !== child && el.contains(child);
    },

    /**
     * Wraps base element in wrapper element.
     * @param {HTMLElement} wrapper
     * @returns {HTMLElement} wrapper element
     */
    wrap: function (wrapper) {
      if (el.parentNode) {
        el.parentNode.insertBefore(wrapper, el);
      }

      wrapper.appendChild(el);
      return wrapper;
    },

    /**
     * Unwraps base element.
     * @returns {Node[]} - child nodes of unwrapped element.
     */
    unwrap: function () {
      const nodes = Array.prototype.slice.call(el.childNodes);
      let wrapper;

      nodes.forEach(function (node) {
        wrapper = node.parentNode;
        dom(node).insertBefore(node.parentNode);
        dom(wrapper).remove();
      });

      return nodes;
    },

    /**
     * Returns array of base element parents.
     * @returns {HTMLElement[]}
     */
    parents: function () {
      const path = [];
      let parent;

      while ((parent = el.parentNode)) {
        path.push(parent);
        el = parent;
      }

      return path;
    },

    /**
     * Normalizes text nodes within base element, ie. merges sibling text nodes and assures that every
     * element node has only one text node.
     * It should does the same as standard element.normalize, but IE implements it incorrectly.
     */
    normalizeTextNodes: function () {
      if (!el) {
        return;
      }

      if (el.nodeType === NODE_TYPE.TEXT_NODE) {
        while (el.nextSibling && el.nextSibling.nodeType === NODE_TYPE.TEXT_NODE) {
          el.nodeValue += el.nextSibling.nodeValue;
          el.parentNode.removeChild(el.nextSibling);
        }
      } else {
        dom(el.firstChild).normalizeTextNodes();
      }
      dom(el.nextSibling).normalizeTextNodes();
    },

    /**
     * Returns element background color.
     * @returns {CSSStyleDeclaration.backgroundColor}
     */
    color: function () {
      return el.style.backgroundColor;
    },

    /**
     * Creates dom element from given html string.
     * @param {string} html
     * @returns {NodeList}
     */
    fromHTML: function (html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.childNodes;
    },

    /**
     * Returns first range of the window of base element.
     * @returns {Range}
     */
    getRange: function () {
      const selection = dom(el).getSelection();
      let range;

      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      }

      return range;
    },

    /**
     * Removes all ranges of the window of base element.
     */
    removeAllRanges: function () {
      const selection = dom(el).getSelection();
      selection.removeAllRanges();
    },

    /**
     * Returns selection object of the window of base element.
     * @returns {Selection}
     */
    getSelection: function () {
      return dom(el).getWindow().getSelection();
    },

    /**
     * Returns window of the base element.
     * @returns {Window}
     */
    getWindow: function () {
      return dom(el).getDocument().defaultView;
    },

    /**
     * Returns document of the base element.
     * @returns {HTMLDocument}
     */
    getDocument: function () {
      // if ownerDocument is null then el is the document itself.
      return el.ownerDocument || el;
    }

  };
};
