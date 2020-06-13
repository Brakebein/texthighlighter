/**
 * @class TextHighlighter
 */
export class TextHighlighter {
    /**
     * Creates wrapper for highlights.
     * TextHighlighter instance calls this method each time it needs to create highlights and pass options retrieved
     * in constructor.
     * @param {object} options - the same object as in TextHighlighter constructor.
     * @returns {HTMLElement}
     * @memberof TextHighlighter
     * @static
     */
    static createWrapper(options: object): HTMLElement;
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
    constructor(element: HTMLElement, options?: {
        color?: string | undefined;
        highlightedClass?: string | undefined;
        contextClass?: string | undefined;
        onRemoveHighlight?: Function | undefined;
        onBeforeHighlight?: Function | undefined;
        onAfterHighlight?: Function | undefined;
    });
    el: HTMLElement;
    options: any;
    /**
     * Permanently disables highlighting.
     * Unbinds events and remove context element class.
     */
    destroy(): void;
    highlightHandler(): void;
    /**
     * Highlights current range.
     * @param {boolean} keepRange - Don't remove range after highlighting. Default: false.
     */
    doHighlight(keepRange?: boolean): void;
    /**
     * Highlights range.
     * Wraps text of given range object in wrapper element.
     * @param {Range} range
     * @param {HTMLElement} wrapper
     * @returns {Array} - array of created highlights.
     */
    highlightRange(range: Range, wrapper: HTMLElement): any[];
    /**
     * Normalizes highlights. Ensures that highlighting is done with use of the smallest possible number of
     * wrapping HTML elements.
     * Flattens highlights structure and merges sibling highlights. Normalizes text nodes within highlights.
     * @param {Array} highlights - highlights to normalize.
     * @returns {Array} - array of normalized highlights. Order and number of returned highlights may be different than
     * input highlights.
     */
    normalizeHighlights(highlights: any[]): any[];
    /**
     * Flattens highlights structure.
     * Note: this method changes input highlights - their order and number after calling this method may change.
     * @param {Array} highlights - highlights to flatten.
     */
    flattenNestedHighlights(highlights: any[]): void;
    /**
     * Merges sibling highlights and normalizes descendant text nodes.
     * Note: this method changes input highlights - their order and number after calling this method may change.
     * @param highlights
     */
    mergeSiblingHighlights(highlights: any): void;
    /**
     * Sets highlighting color.
     * @param {string} color - valid CSS color.
     */
    setColor(color: string): void;
    /**
     * Returns highlighting color.
     * @returns {string}
     */
    getColor(): string;
    /**
     * Removes highlights from element. If element is a highlight itself, it is removed as well.
     * If no element is given, all highlights all removed.
     * @param {HTMLElement} [element] - element to remove highlights from
     */
    removeHighlights(element?: HTMLElement): void;
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
    getHighlights(params?: {}): any[];
    /**
     * Returns true if element is a highlight.
     * All highlights have 'data-highlighted' attribute.
     * @param el - element to check.
     * @returns {boolean}
     */
    isHighlight(el: any): boolean;
    /**
     * Serializes all highlights in the element the highlighter is applied to.
     * @returns {string} - stringified JSON with highlights definition
     */
    serializeHighlights(): string;
    /**
     * Deserializes highlights.
     * @throws exception when can't parse JSON or JSON has invalid structure.
     * @param {string} json - JSON string with highlights definition.
     * @returns {Array} - array of deserialized highlights.
     */
    deserializeHighlights(json: string): any[];
    /**
     * Finds and highlights given text.
     * @param {string} text - text to search for
     * @param {boolean} [caseSensitive] - if set to true, performs case sensitive search (default: true)
     */
    find(text: string, caseSensitive?: boolean): void;
}
