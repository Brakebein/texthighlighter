export function bindEvents(el, scope) {
  el.addEventListener('mouseup', scope.highlightHandler.bind(scope));
  el.addEventListener('touchend', scope.highlightHandler.bind(scope));
}

export function unbindEvents(el, scope) {
  el.removeEventListener('mouseup', scope.highlightHandler.bind(scope));
  el.removeEventListener('touchend', scope.highlightHandler.bind(scope));
}
