"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbindEvents = exports.bindEvents = void 0;
function bindEvents(el, scope) {
    el.addEventListener('mouseup', scope.highlightHandler.bind(scope));
    el.addEventListener('touchend', scope.highlightHandler.bind(scope));
}
exports.bindEvents = bindEvents;
function unbindEvents(el, scope) {
    el.removeEventListener('mouseup', scope.highlightHandler.bind(scope));
    el.removeEventListener('touchend', scope.highlightHandler.bind(scope));
}
exports.unbindEvents = unbindEvents;
