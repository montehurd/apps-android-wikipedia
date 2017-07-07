(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.pagelib = factory());
}(this, (function () { 'use strict';

// This file exists for CSS packaging only. It imports the CSS which is to be
// packaged in the override CSS build product.

// todo: delete Empty.css when other overrides exist

/**
 * Polyfill function that tells whether a given element matches a selector.
 * @param {!Element} el Element
 * @param {!string} selector Selector to look for
 * @return {!boolean} Whether the element matches the selector
 */
var matchesSelector = function matchesSelector(el, selector) {
  if (el.matches) {
    return el.matches(selector);
  }
  if (el.matchesSelector) {
    return el.matchesSelector(selector);
  }
  if (el.webkitMatchesSelector) {
    return el.webkitMatchesSelector(selector);
  }
  return false;
};

// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
// Required by Android API 16 AOSP Nexus S emulator.
// eslint-disable-next-line no-undef
var CustomEvent = typeof window !== 'undefined' && window.CustomEvent || function (type) {
  var parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { bubbles: false, cancelable: false, detail: undefined };

  // eslint-disable-next-line no-undef
  var event = document.createEvent('CustomEvent');
  event.initCustomEvent(type, parameters.bubbles, parameters.cancelable, parameters.detail);
  return event;
};

var Polyfill = { matchesSelector: matchesSelector, CustomEvent: CustomEvent };

/**
 * Returns closest ancestor of element which matches selector.
 * Similar to 'closest' methods as seen here:
 *  https://api.jquery.com/closest/
 *  https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
 * @param  {!Element} el        Element
 * @param  {!string} selector   Selector to look for in ancestors of 'el'
 * @return {?HTMLElement}       Closest ancestor of 'el' matching 'selector'
 */
var findClosestAncestor = function findClosestAncestor(el, selector) {
  var parentElement = void 0;
  for (parentElement = el.parentElement; parentElement && !Polyfill.matchesSelector(parentElement, selector); parentElement = parentElement.parentElement) {
    // Intentionally empty.
  }
  return parentElement;
};

/**
 * Determines if element has a table ancestor.
 * @param  {!Element}  el   Element
 * @return {boolean}        Whether table ancestor of 'el' is found
 */
var isNestedInTable = function isNestedInTable(el) {
  return Boolean(findClosestAncestor(el, 'table'));
};

/**
 * @param {!HTMLElement} element
 * @return {!boolean} true if element affects layout, false otherwise.
 */
var isVisible = function isVisible(element) {
  return (
    // https://github.com/jquery/jquery/blob/305f193/src/css/hiddenVisibleSelectors.js#L12
    Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  );
};

/**
 * @param {!Element} element
 * @param {!Rectangle} rectangle A rectangle relative the viewport.
 * @return {!boolean} true if element and rectangle overlap, false otherwise.
 */
var intersectsViewportRectangle = function intersectsViewportRectangle(element, rectangle) {
  var bounds = element.getBoundingClientRect();
  return !(bounds.top > rectangle.bottom || bounds.right < rectangle.left || bounds.bottom < rectangle.top || bounds.left > rectangle.right);
};

/**
 * Move attributes from source to destination as data-* attributes.
 * @param {!HTMLElement} source
 * @param {!HTMLElement} destination
 * @param {!string[]} attributes
 * @return {void}
 */
var moveAttributesToDataAttributes = function moveAttributesToDataAttributes(source, destination, attributes) {
  attributes.forEach(function (attribute) {
    if (source.hasAttribute(attribute)) {
      destination.setAttribute('data-' + attribute, source.getAttribute(attribute));
      source.removeAttribute(attribute);
    }
  });
};

/**
 * Move data-* attributes from source to destination as attributes.
 * @param {!HTMLElement} source
 * @param {!HTMLElement} destination
 * @param {!string[]} attributes
 * @return {void}
 */
var moveDataAttributesToAttributes = function moveDataAttributesToAttributes(source, destination, attributes) {
  attributes.forEach(function (attribute) {
    var dataAttribute = 'data-' + attribute;
    if (source.hasAttribute(dataAttribute)) {
      destination.setAttribute(attribute, source.getAttribute(dataAttribute));
      source.removeAttribute(dataAttribute);
    }
  });
};

/**
 * Copy data-* attributes from source to destination as attributes.
 * @param {!HTMLElement} source
 * @param {!HTMLElement} destination
 * @param {!string[]} attributes
 * @return {void}
 */
var copyDataAttributesToAttributes = function copyDataAttributesToAttributes(source, destination, attributes) {
  attributes.forEach(function (attribute) {
    var dataAttribute = 'data-' + attribute;
    if (source.hasAttribute(dataAttribute)) {
      destination.setAttribute(attribute, source.getAttribute(dataAttribute));
    }
  });
};

var elementUtilities = {
  findClosestAncestor: findClosestAncestor,
  isNestedInTable: isNestedInTable,
  isVisible: isVisible,
  intersectsViewportRectangle: intersectsViewportRectangle,
  moveAttributesToDataAttributes: moveAttributesToDataAttributes,
  moveDataAttributesToAttributes: moveDataAttributesToAttributes,
  copyDataAttributesToAttributes: copyDataAttributesToAttributes
};

var SECTION_TOGGLED_EVENT_TYPE = 'section-toggled';

/**
 * Find an array of table header (TH) contents. If there are no TH elements in
 * the table or the header's link matches pageTitle, an empty array is returned.
 * @param {!Element} element
 * @param {?string} pageTitle Unencoded page title; if this title matches the
 *                            contents of the header exactly, it will be omitted.
 * @return {!Array<string>}
 */
var getTableHeader = function getTableHeader(element, pageTitle) {
  var thArray = [];

  if (!element.children) {
    return thArray;
  }

  for (var i = 0; i < element.children.length; i++) {
    var el = element.children[i];

    if (el.tagName === 'TH') {
      // ok, we have a TH element!
      // However, if it contains more than two links, then ignore it, because
      // it will probably appear weird when rendered as plain text.
      var aNodes = el.querySelectorAll('a');
      // todo: these conditionals are very confusing. Rewrite by extracting a
      //       method or simplify.
      if (aNodes.length < 3) {
        // todo: remove nonstandard Element.innerText usage
        // Also ignore it if it's identical to the page title.
        if ((el.innerText && el.innerText.length || el.textContent.length) > 0 && el.innerText !== pageTitle && el.textContent !== pageTitle && el.innerHTML !== pageTitle) {
          thArray.push(el.innerText || el.textContent);
        }
      }
    }

    // if it's a table within a table, don't worry about it
    if (el.tagName === 'TABLE') {
      continue;
    }

    // todo: why do we need to recurse?
    // recurse into children of this element
    var ret = getTableHeader(el, pageTitle);

    // did we get a list of TH from this child?
    if (ret.length > 0) {
      thArray = thArray.concat(ret);
    }
  }

  return thArray;
};

/**
 * @typedef {function} FooterDivClickCallback
 * @param {!HTMLElement}
 * @return {void}
 */

/**
 * Ex: toggleCollapseClickCallback.bind(el, (container) => {
 *       window.scrollTo(0, container.offsetTop - transformer.getDecorOffset())
 *     })
 * @this HTMLElement
 * @param {?FooterDivClickCallback} footerDivClickCallback
 * @return {boolean} true if collapsed, false if expanded.
 */
var toggleCollapseClickCallback = function toggleCollapseClickCallback(footerDivClickCallback) {
  var container = this.parentNode;
  var header = container.children[0];
  var table = container.children[1];
  var footer = container.children[2];
  var caption = header.querySelector('.app_table_collapsed_caption');
  var collapsed = table.style.display !== 'none';
  if (collapsed) {
    table.style.display = 'none';
    header.classList.remove('app_table_collapse_close'); // todo: use app_table_collapsed_collapsed
    header.classList.remove('app_table_collapse_icon'); // todo: use app_table_collapsed_icon
    header.classList.add('app_table_collapsed_open'); // todo: use app_table_collapsed_expanded
    if (caption) {
      caption.style.visibility = 'visible';
    }
    footer.style.display = 'none';
    // if they clicked the bottom div, then scroll back up to the top of the table.
    if (this === footer && footerDivClickCallback) {
      footerDivClickCallback(container);
    }
  } else {
    table.style.display = 'block';
    header.classList.remove('app_table_collapsed_open'); // todo: use app_table_collapsed_expanded
    header.classList.add('app_table_collapse_close'); // todo: use app_table_collapsed_collapsed
    header.classList.add('app_table_collapse_icon'); // todo: use app_table_collapsed_icon
    if (caption) {
      caption.style.visibility = 'hidden';
    }
    footer.style.display = 'block';
  }
  return collapsed;
};

/**
 * @param {!HTMLElement} table
 * @return {!boolean} true if table should be collapsed, false otherwise.
 */
var shouldTableBeCollapsed = function shouldTableBeCollapsed(table) {
  var classBlacklist = ['navbox', 'vertical-navbox', 'navbox-inner', 'metadata', 'mbox-small'];
  var blacklistIntersects = classBlacklist.some(function (clazz) {
    return table.classList.contains(clazz);
  });
  return table.style.display !== 'none' && !blacklistIntersects;
};

/**
 * @param {!Element} element
 * @return {!boolean} true if element is an infobox, false otherwise.
 */
var isInfobox = function isInfobox(element) {
  return element.classList.contains('infobox');
};

/**
 * @param {!Document} document
 * @param {?string} content HTML string.
 * @return {!HTMLDivElement}
 */
var newCollapsedHeaderDiv = function newCollapsedHeaderDiv(document, content) {
  var div = document.createElement('div');
  div.classList.add('app_table_collapsed_container');
  div.classList.add('app_table_collapsed_open');
  div.innerHTML = content || '';
  return div;
};

/**
 * @param {!Document} document
 * @param {?string} content HTML string.
 * @return {!HTMLDivElement}
 */
var newCollapsedFooterDiv = function newCollapsedFooterDiv(document, content) {
  var div = document.createElement('div');
  div.classList.add('app_table_collapsed_bottom');
  div.classList.add('app_table_collapse_icon'); // todo: use collapsed everywhere
  div.innerHTML = content || '';
  return div;
};

/**
 * @param {!string} title
 * @param {!string[]} headerText
 * @return {!string} HTML string.
 */
var newCaption = function newCaption(title, headerText) {
  var caption = '<strong>' + title + '</strong>';

  caption += '<span class=app_span_collapse_text>';
  if (headerText.length > 0) {
    caption += ': ' + headerText[0];
  }
  if (headerText.length > 1) {
    caption += ', ' + headerText[1];
  }
  if (headerText.length > 0) {
    caption += ' …';
  }
  caption += '</span>';

  return caption;
};

/**
 * @param {!Window} window
 * @param {!Element} content
 * @param {?string} pageTitle
 * @param {?boolean} isMainPage
 * @param {?string} infoboxTitle
 * @param {?string} otherTitle
 * @param {?string} footerTitle
 * @param {?FooterDivClickCallback} footerDivClickCallback
 * @return {void}
 */
var collapseTables = function collapseTables(window, content, pageTitle, isMainPage, infoboxTitle, otherTitle, footerTitle, footerDivClickCallback) {
  if (isMainPage) {
    return;
  }

  var tables = content.querySelectorAll('table');

  var _loop = function _loop(i) {
    var table = tables[i];

    if (elementUtilities.findClosestAncestor(table, '.app_table_container') || !shouldTableBeCollapsed(table)) {
      return 'continue';
    }

    // todo: this is actually an array
    var headerText = getTableHeader(table, pageTitle);
    if (!headerText.length && !isInfobox(table)) {
      return 'continue';
    }
    var caption = newCaption(isInfobox(table) ? infoboxTitle : otherTitle, headerText);

    // create the container div that will contain both the original table
    // and the collapsed version.
    var containerDiv = window.document.createElement('div');
    containerDiv.className = 'app_table_container';
    table.parentNode.insertBefore(containerDiv, table);
    table.parentNode.removeChild(table);

    // remove top and bottom margin from the table, so that it's flush with
    // our expand/collapse buttons
    table.style.marginTop = '0px';
    table.style.marginBottom = '0px';

    var collapsedHeaderDiv = newCollapsedHeaderDiv(window.document, caption);
    collapsedHeaderDiv.style.display = 'block';

    var collapsedFooterDiv = newCollapsedFooterDiv(window.document, footerTitle);
    collapsedFooterDiv.style.display = 'none';

    // add our stuff to the container
    containerDiv.appendChild(collapsedHeaderDiv);
    containerDiv.appendChild(table);
    containerDiv.appendChild(collapsedFooterDiv);

    // set initial visibility
    table.style.display = 'none';

    // eslint-disable-next-line require-jsdoc, no-loop-func
    var dispatchSectionToggledEvent = function dispatchSectionToggledEvent(collapsed) {
      return (
        // eslint-disable-next-line no-undef
        window.dispatchEvent(new Polyfill.CustomEvent(SECTION_TOGGLED_EVENT_TYPE, { collapsed: collapsed }))
      );
    };

    // assign click handler to the collapsed divs
    collapsedHeaderDiv.onclick = function () {
      var collapsed = toggleCollapseClickCallback.bind(collapsedHeaderDiv)();
      dispatchSectionToggledEvent(collapsed);
    };
    collapsedFooterDiv.onclick = function () {
      var collapsed = toggleCollapseClickCallback.bind(collapsedFooterDiv, footerDivClickCallback)();
      dispatchSectionToggledEvent(collapsed);
    };
  };

  for (var i = 0; i < tables.length; ++i) {
    var _ret = _loop(i);

    if (_ret === 'continue') continue;
  }
};

/**
 * If you tap a reference targeting an anchor within a collapsed table, this
 * method will expand the references section. The client can then scroll to the
 * references section.
 *
 * The first reference (an "[A]") in the "enwiki > Airplane" article from ~June
 * 2016 exhibits this issue. (You can copy wikitext from this revision into a
 * test wiki page for testing.)
 * @param  {?Element} element
 * @return {void}
*/
var expandCollapsedTableIfItContainsElement = function expandCollapsedTableIfItContainsElement(element) {
  if (element) {
    var containerSelector = '[class*="app_table_container"]';
    var container = elementUtilities.findClosestAncestor(element, containerSelector);
    if (container) {
      var collapsedDiv = container.firstElementChild;
      if (collapsedDiv && collapsedDiv.classList.contains('app_table_collapsed_open')) {
        collapsedDiv.click();
      }
    }
  }
};

var CollapseTable = {
  SECTION_TOGGLED_EVENT_TYPE: SECTION_TOGGLED_EVENT_TYPE,
  toggleCollapseClickCallback: toggleCollapseClickCallback,
  collapseTables: collapseTables,
  expandCollapsedTableIfItContainsElement: expandCollapsedTableIfItContainsElement,
  test: {
    getTableHeader: getTableHeader,
    shouldTableBeCollapsed: shouldTableBeCollapsed,
    isInfobox: isInfobox,
    newCollapsedHeaderDiv: newCollapsedHeaderDiv,
    newCollapsedFooterDiv: newCollapsedFooterDiv,
    newCaption: newCaption
  }
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();



























var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

/** Function rate limiter. */
var Throttle = function () {
  createClass(Throttle, null, [{
    key: "wrap",

    /**
     * Wraps a function in a Throttle.
     * @param {!Window} window
     * @param {!number} period The nonnegative minimum number of milliseconds between function
     *                         invocations.
     * @param {!function} funktion The function to invoke when not throttled.
     * @return {!function} A function wrapped in a Throttle.
     */
    value: function wrap(window, period, funktion) {
      var throttle = new Throttle(window, period, funktion);
      var throttled = function Throttled() {
        return throttle.queue(this, arguments);
      };
      throttled.result = function () {
        return throttle.result;
      };
      throttled.pending = function () {
        return throttle.pending();
      };
      throttled.delay = function () {
        return throttle.delay();
      };
      throttled.cancel = function () {
        return throttle.cancel();
      };
      throttled.reset = function () {
        return throttle.reset();
      };
      return throttled;
    }

    /**
     * @param {!Window} window
     * @param {!number} period The nonnegative minimum number of milliseconds between function
     *                         invocations.
     * @param {!function} funktion The function to invoke when not throttled.
     */

  }]);

  function Throttle(window, period, funktion) {
    classCallCheck(this, Throttle);

    this._window = window;
    this._period = period;
    this._function = funktion;

    // The upcoming invocation's context and arguments.
    this._context = undefined;
    this._arguments = undefined;

    // The previous invocation's result, timeout identifier, and last run timestamp.
    this._result = undefined;
    this._timeout = 0;
    this._timestamp = 0;
  }

  /**
   * The return value of the initial run is always undefined. The return value of subsequent runs is
   * always a previous result. The context and args used by a future invocation are always the most
   * recently supplied. Invocations, even if immediately eligible, are dispatched.
   * @param {?any} context
   * @param {?any} args The arguments passed to the underlying function.
   * @return {?any} The cached return value of the underlying function.
   */


  createClass(Throttle, [{
    key: "queue",
    value: function queue(context, args) {
      var _this = this;

      // Always update the this and arguments to the latest supplied.
      this._context = context;
      this._arguments = args;

      if (!this.pending()) {
        // Queue a new invocation.
        this._timeout = this._window.setTimeout(function () {
          _this._timeout = 0;
          _this._timestamp = Date.now();
          _this._result = _this._function.apply(_this._context, _this._arguments);
        }, this.delay());
      }

      // Always return the previous result.
      return this.result;
    }

    /** @return {?any} The cached return value of the underlying function. */

  }, {
    key: "pending",


    /** @return {!boolean} true if an invocation is queued. */
    value: function pending() {
      return Boolean(this._timeout);
    }

    /**
     * @return {!number} The nonnegative number of milliseconds until an invocation is eligible to
     *                   run.
     */

  }, {
    key: "delay",
    value: function delay() {
      if (!this._timestamp) {
        return 0;
      }
      return Math.max(0, this._period - (Date.now() - this._timestamp));
    }

    /**
     * Clears any pending invocation but doesn't clear time last invoked or prior result.
     * @return {void}
     */

  }, {
    key: "cancel",
    value: function cancel() {
      if (this._timeout) {
        this._window.clearTimeout(this._timeout);
      }
      this._timeout = 0;
    }

    /**
     * Clears any pending invocation, time last invoked, and prior result.
     * @return {void}
     */

  }, {
    key: "reset",
    value: function reset() {
      this.cancel();
      this._result = undefined;
      this._timestamp = 0;
    }
  }, {
    key: "result",
    get: function get$$1() {
      return this._result;
    }
  }]);
  return Throttle;
}();

/** This class provides a mechanism to subscribe to rate limited events. */

var _class = function () {
  /**
   * @param {!Window} window A dependency of the throttle mechanism.
   * @param {!number} period The nonnegative minimum number of milliseconds between publishing
   *                         events.
   */
  function _class(window, period) {
    var _this = this;

    classCallCheck(this, _class);

    this._throttle = Throttle.wrap(window, period, function () {
      return _this._eventTarget.dispatchEvent(_this._publishEvent);
    });

    this._eventTarget = undefined;
    this._subscribeEventType = undefined;
    this._publishEvent = undefined;
  }

  /**
   * @param {!EventTarget} eventTarget The target to subscribe to events from and publish throttled
   *                                   events to.
   * @param {!string} subscribeEventType The input event type to listen for.
   * @param {!Event} publishEvent The output event to post.
   * @return {void}
   */


  createClass(_class, [{
    key: 'register',
    value: function register(eventTarget, subscribeEventType, publishEvent) {
      this._eventTarget = eventTarget;
      this._subscribeEventType = subscribeEventType;
      this._publishEvent = publishEvent;
      this._eventTarget.addEventListener(subscribeEventType, this._throttle);
    }

    /** @return {!boolean} */

  }, {
    key: 'registered',
    value: function registered() {
      return Boolean(this._eventTarget);
    }

    /**
     * This method may be safely called even when unregistered.
     * @return {void}
     */

  }, {
    key: 'deregister',
    value: function deregister() {
      if (!this.registered()) {
        return;
      }

      this._eventTarget.removeEventListener(this._subscribeEventType, this._throttle);
      this._publishEvent = undefined;
      this._subscribeEventType = undefined;
      this._eventTarget = undefined;

      this._throttle.reset();
    }
  }]);
  return _class;
}();

// CSS classes used to identify and present transformed images. An image is only a member of one
// class at a time depending on the current transform state. These class names should match the
// classes in LazyLoadTransform.css.
var PENDING_CLASS = 'pagelib-lazy-load-image-pending'; // Download pending or started.
var LOADED_CLASS = 'pagelib-lazy-load-image-loaded'; // Download completed.

// Attributes saved via data-* attributes for later restoration. These attributes can cause files to
// be downloaded when set so they're temporarily preserved and removed. Additionally, `style.width`
// and `style.height` are saved with their priorities. In the rare case that a conflicting data-*
// attribute already exists, it is overwritten.
var PRESERVE_ATTRIBUTES = ['src', 'srcset'];
var PRESERVE_STYLE_WIDTH_VALUE = 'data-width-value';
var PRESERVE_STYLE_HEIGHT_VALUE = 'data-height-value';
var PRESERVE_STYLE_WIDTH_PRIORITY = 'data-width-priority';
var PRESERVE_STYLE_HEIGHT_PRIORITY = 'data-height-priority';

// A transparent single pixel gif via https://stackoverflow.com/a/15960901/970346.
var PLACEHOLDER_URI = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAI=';

// Small images, especially icons, are quickly downloaded and may appear in many places. Lazily
// loading these images degrades the experience with little gain. Always eagerly load these images.
// Example: flags in the medal count for the "1896 Summer Olympics medal table."
// https://en.m.wikipedia.org/wiki/1896_Summer_Olympics_medal_table?oldid=773498394#Medal_count
var UNIT_TO_MINIMUM_TRANSFORM_SIZE = {
  px: 50, // https://phabricator.wikimedia.org/diffusion/EMFR/browse/master/includes/MobileFormatter.php;c89f371ea9e789d7e1a827ddfec7c8028a549c12$22
  ex: 10, // ''
  em: 5 // 1ex ≈ .5em; https://developer.mozilla.org/en-US/docs/Web/CSS/length#Units


  /**
   * @param {!HTMLImageElement} image The image to be consider.
   * @return {!boolean} true if image should be lazily loaded, false if image should be eagerly
   *                    loaded.
  */
};var isTransformable = function isTransformable(image) {
  return ['width', 'height'].every(function (dimension) {
    var valueUnit = image.style.getPropertyValue(dimension) || '';

    if (valueUnit === '' && image.hasAttribute(dimension)) {
      valueUnit = image.getAttribute(dimension) + 'px';
    }

    var _ref = valueUnit.match(/(\d+)(\D+)/) || [],
        _ref2 = slicedToArray(_ref, 3),
        value = _ref2[1],
        unit = _ref2[2];

    return value === undefined || value >= UNIT_TO_MINIMUM_TRANSFORM_SIZE[unit];
  });
};

/**
 * Replace image data with placeholder content.
 * @param {!Document} document
 * @param {!HTMLImageElement} image The image to be updated.
 * @return {void}
 */
var transformImage = function transformImage(document, image) {
  // There are a number of possible implementations including:
  //
  // - [Previous] Replace the original image with a span and append a new downloaded image to the
  //   span.
  //   This option has the best cross-fading and extensibility but makes the CSS rules for the
  //   appended image impractical.
  //
  // - [MobileFrontend] Replace the original image with a span and replace the span with a new
  //   downloaded image.
  //   This option has a good fade-in but has some CSS concerns for the placeholder, particularly
  //   `max-width`.
  //
  // - [Current] Replace the original image's source with a transparent image and update the source
  //   from a new downloaded image.
  //   This option has a good fade-in but minimal CSS concerns for the placeholder and image.
  //
  // Minerva's tricky image dimension CSS rule cannot be disinherited:
  //
  //   .content a > img {
  //     max-width: 100% !important;
  //     height: auto !important;
  //   }
  //
  // This forces an image to be bound to screen width and to appear (with scrollbars) proportionally
  // when it is too large. For the current implementation, unfortunately, the transparent
  // placeholder image rarely matches the original's aspect ratio and `height: auto !important`
  // forces this ratio to be used instead of the original's. MobileFrontend uses spans for
  // placeholders and the CSS rule does not apply. This implementation sets the dimensions as an
  // inline style with height as `!important` to override MobileFrontend. For images that are capped
  // by `max-width`, this usually causes the height of the placeholder and the height of the loaded
  // image to mismatch which causes a reflow. To stimulate this issue, go to the "Pablo Picasso"
  // article and set the screen width to be less than the image width. When placeholders are
  // replaced with images, the image height reduces dramatically. MobileFrontend has the same
  // limitation with spans. Note: clientWidth is unavailable since this transform occurs in a
  // separate Document.
  //
  // Reflows also occur in this and MobileFrontend when the image width or height do not match the
  // actual file dimensions. e.g., see the image captioned "Obama and his wife Michelle at the Civil
  // Rights Summit..." on the "Barack Obama" article.
  //
  // https://phabricator.wikimedia.org/diffusion/EMFR/browse/master/resources/skins.minerva.content.styles/images.less;e15c49de788cd451abe648497123480da1c9c9d4$55
  // https://en.m.wikipedia.org/wiki/Barack_Obama?oldid=789232530
  // https://en.m.wikipedia.org/wiki/Pablo_Picasso?oldid=788122694
  var width = image.style.getPropertyValue('width');
  if (width) {
    image.setAttribute(PRESERVE_STYLE_WIDTH_VALUE, width);
    image.setAttribute(PRESERVE_STYLE_WIDTH_PRIORITY, image.style.getPropertyPriority('width'));
  } else if (image.hasAttribute('width')) {
    width = image.getAttribute('width') + 'px';
  }
  // !important priority for WidenImage (`width: 100% !important` and placeholder is 1px wide).
  if (width) {
    image.style.setProperty('width', width, 'important');
  }

  var height = image.style.getPropertyValue('height');
  if (height) {
    image.setAttribute(PRESERVE_STYLE_HEIGHT_VALUE, height);
    image.setAttribute(PRESERVE_STYLE_HEIGHT_PRIORITY, image.style.getPropertyPriority('height'));
  } else if (image.hasAttribute('height')) {
    height = image.getAttribute('height') + 'px';
  }
  // !important priority for Minerva.
  if (height) {
    image.style.setProperty('height', height, 'important');
  }

  elementUtilities.moveAttributesToDataAttributes(image, image, PRESERVE_ATTRIBUTES);
  image.setAttribute('src', PLACEHOLDER_URI);

  image.classList.add(PENDING_CLASS);
};

/**
 * @param {!HTMLImageElement} image
 * @return {void}
 */
var loadImageCallback = function loadImageCallback(image) {
  if (image.hasAttribute(PRESERVE_STYLE_WIDTH_VALUE)) {
    image.style.setProperty('width', image.getAttribute(PRESERVE_STYLE_WIDTH_VALUE), image.getAttribute(PRESERVE_STYLE_WIDTH_PRIORITY));
  } else {
    image.style.removeProperty('width');
  }

  if (image.hasAttribute(PRESERVE_STYLE_HEIGHT_VALUE)) {
    image.style.setProperty('height', image.getAttribute(PRESERVE_STYLE_HEIGHT_VALUE), image.getAttribute(PRESERVE_STYLE_HEIGHT_PRIORITY));
  } else {
    image.style.removeProperty('height');
  }
};

/**
 * Start downloading image resources associated with a given image element and update the
 * placeholder with the original content when available.
 * @param {!Document} document
 * @param {!HTMLImageElement} image The old image element showing placeholder content. This element
 *                                  will be updated when the new image resources finish downloading.
 * @return {!HTMLElement} A new image element for downloading the resources.
 */
var loadImage = function loadImage(document, image) {
  var download = document.createElement('img');

  // Add the download listener prior to setting the src attribute to avoid missing the load event.
  download.addEventListener('load', function () {
    image.classList.add(LOADED_CLASS);
    image.classList.remove(PENDING_CLASS);

    // Add the restoration listener prior to setting the src attribute to avoid missing the load
    // event.
    image.addEventListener('load', function () {
      return loadImageCallback(image);
    }, { once: true });

    // Set src and other attributes, triggering a download from cache which still takes time on
    // older devices and can cause a reflow due to the call to `style.removeProperty('height')`
    // necessary on the same devices.
    elementUtilities.moveDataAttributesToAttributes(image, image, PRESERVE_ATTRIBUTES);
  }, { once: true });

  // Set src and other attributes, triggering a download.
  elementUtilities.copyDataAttributesToAttributes(image, download, PRESERVE_ATTRIBUTES);

  return download;
};

/**
 * @param {!Element} element
 * @return {!HTMLImageElement[]} Transformable images descendent from but not including element.
 */
var queryTransformImages = function queryTransformImages(element) {
  return Array.prototype.slice.call(element.querySelectorAll('img')).filter(function (image) {
    return isTransformable(image);
  });
};

/**
 * Replace images with placeholders. The transformation is inverted by calling loadImage().
 * @param {!Document} document
 * @param {!HTMLImageElement[]} images The images to lazily load.
 * @return {void}
 */
var transform = function transform(document, images) {
  return images.forEach(function (image) {
    return transformImage(document, image);
  });
};

var LazyLoadTransform = { loadImage: loadImage, queryTransformImages: queryTransformImages, transform: transform };

/** A rectangle. */
var _class$2 = function () {
  /**
   * @param {!number} top
   * @param {!number} right
   * @param {!number} bottom
   * @param {!number} left
   */
  function _class(top, right, bottom, left) {
    classCallCheck(this, _class);

    this._top = top;
    this._right = right;
    this._bottom = bottom;
    this._left = left;
  }

  /** @return {!number} */


  createClass(_class, [{
    key: "toString",


    // eslint-disable-next-line require-jsdoc
    value: function toString() {
      return "(" + this.left + ", " + this.top + "), (" + this.right + ", " + this.bottom + ")";
    }
  }, {
    key: "top",
    get: function get$$1() {
      return this._top;
    }

    /** @return {!number} */

  }, {
    key: "right",
    get: function get$$1() {
      return this._right;
    }

    /** @return {!number} */

  }, {
    key: "bottom",
    get: function get$$1() {
      return this._bottom;
    }

    /** @return {!number} */

  }, {
    key: "left",
    get: function get$$1() {
      return this._left;
    }
  }]);
  return _class;
}();

var UNTHROTTLED_RESIZE_EVENT_TYPE = 'resize';
var UNTHROTTLED_SCROLL_EVENT_TYPE = 'scroll';
var THROTTLED_RESIZE_EVENT_TYPE = 'resize:lazy-load-throttled';
var THROTTLED_SCROLL_EVENT_TYPE = 'scroll:lazy-load-throttled';

var THROTTLE_PERIOD_MILLISECONDS = 100;

/**
 * This class subscribes to key page events, applying lazy load transforms or inversions as
 * applicable. It has external dependencies on the section-toggled custom event and the following
 * standard browser events: resize, scroll.
 */

var _class$1 = function () {
  /**
   * @param {!Window} window
   * @param {!number} loadDistanceMultiplier viewport distance multiplier.
   */
  function _class$$1(window, loadDistanceMultiplier) {
    var _this = this;

    classCallCheck(this, _class$$1);

    this._window = window;

    this._images = [];
    this._resizeEventThrottle = new _class(window, THROTTLE_PERIOD_MILLISECONDS);
    this._scrollEventThrottle = new _class(window, THROTTLE_PERIOD_MILLISECONDS);
    this._loadImagesCallback = function () {
      return _this._loadImages(_this._newLoadEligibilityRectangle(loadDistanceMultiplier));
    };
  }

  /**
   * Replace images with placeholders. Calling this function may register this instance to listen to
   * page events.
   * @param {!Element} element
   * @return {void}
   */


  createClass(_class$$1, [{
    key: 'transform',
    value: function transform(element) {
      var images = LazyLoadTransform.queryTransformImages(element);
      LazyLoadTransform.transform(this._window.document, images);
      this._images = this._images.concat(images);
      this._register();
    }

    /**
     * Manually trigger a load images check. Calling this function may deregister this instance from
     * listening to page events.
     * @return {void}
     */

  }, {
    key: 'loadImages',
    value: function loadImages() {
      this._loadImagesCallback();
    }

    /**
     * This method may be safely called even when already unregistered. This function clears the
     * record of placeholders.
     * @return {void}
     */

  }, {
    key: 'deregister',
    value: function deregister() {
      if (!this._registered()) {
        return;
      }

      this._window.removeEventListener(THROTTLED_SCROLL_EVENT_TYPE, this._loadImagesCallback);
      this._window.removeEventListener(THROTTLED_RESIZE_EVENT_TYPE, this._loadImagesCallback);
      this._window.removeEventListener(CollapseTable.SECTION_TOGGLED_EVENT_TYPE, this._loadImagesCallback);

      this._scrollEventThrottle.deregister();
      this._resizeEventThrottle.deregister();
      this._images = [];
    }

    /**
     * This method may be safely called even when already registered.
     * @return {void}
     */

  }, {
    key: '_register',
    value: function _register() {
      if (this._registered() || !this._images.length) {
        return;
      }

      this._resizeEventThrottle.register(this._window, UNTHROTTLED_RESIZE_EVENT_TYPE, new Polyfill.CustomEvent(THROTTLED_RESIZE_EVENT_TYPE));
      this._scrollEventThrottle.register(this._window, UNTHROTTLED_SCROLL_EVENT_TYPE, new Polyfill.CustomEvent(THROTTLED_SCROLL_EVENT_TYPE));

      this._window.addEventListener(CollapseTable.SECTION_TOGGLED_EVENT_TYPE, this._loadImagesCallback);
      this._window.addEventListener(THROTTLED_RESIZE_EVENT_TYPE, this._loadImagesCallback);
      this._window.addEventListener(THROTTLED_SCROLL_EVENT_TYPE, this._loadImagesCallback);
    }

    /** @return {!boolean} */

  }, {
    key: '_registered',
    value: function _registered() {
      return this._resizeEventThrottle.registered();
    }

    /**
     * @param {!Rectangle} viewport
     * @return {void}
     */

  }, {
    key: '_loadImages',
    value: function _loadImages(viewport) {
      var _this2 = this;

      this._images = this._images.filter(function (placeholder) {
        return !(_this2._isImageEligibleToLoad(placeholder, viewport) && LazyLoadTransform.loadImage(_this2._window.document, placeholder));
      });
      if (this._images.length === 0) {
        this.deregister();
      }
    }

    /**
     * @param {!HTMLSpanElement} placeholder
     * @param {!Rectangle} viewport
     * @return {!boolean}
     */

  }, {
    key: '_isImageEligibleToLoad',
    value: function _isImageEligibleToLoad(placeholder, viewport) {
      return elementUtilities.isVisible(placeholder) && elementUtilities.intersectsViewportRectangle(placeholder, viewport);
    }

    /**
     * @return {!Rectangle} The boundaries for images eligible to load relative the viewport. Images
     *                      within these boundaries may already be loading or loaded; images outside
     *                      of these boundaries should not be loaded as they're ineligible, however,
     *                      they may have previously been loaded.
     */

  }, {
    key: '_newLoadEligibilityRectangle',
    value: function _newLoadEligibilityRectangle(loadDistanceMultiplier) {
      var x = 0;
      var y = 0;
      var width = this._window.innerWidth * loadDistanceMultiplier;
      var height = this._window.innerHeight * loadDistanceMultiplier;
      return new _class$2(y, x + width, y + height, x);
    }
  }]);
  return _class$$1;
}();

/**
 * Configures span to be suitable replacement for red link anchor.
 * @param {!HTMLSpanElement} span The span element to configure as anchor replacement.
 * @param {!HTMLAnchorElement} anchor The anchor element being replaced.
 * @return {void}
 */
var configureRedLinkTemplate = function configureRedLinkTemplate(span, anchor) {
  span.innerHTML = anchor.innerHTML;
  span.setAttribute('class', anchor.getAttribute('class'));
};

/**
 * Finds red links in a document or document fragment.
 * @param {!(Document|DocumentFragment)} content Document or fragment in which to seek red links.
 * @return {!HTMLAnchorElement[]} Array of zero or more red link anchors.
 */
var redLinkAnchorsInContent = function redLinkAnchorsInContent(content) {
  return Array.prototype.slice.call(content.querySelectorAll('a.new'));
};

/**
 * Makes span to be used as cloning template for red link anchor replacements.
 * @param  {!Document} document Document to use to create span element. Reminder: this can't be a
 * document fragment because fragments don't implement 'createElement'.
 * @return {!HTMLSpanElement} Span element suitable for use as template for red link anchor
 * replacements.
 */
var newRedLinkTemplate = function newRedLinkTemplate(document) {
  return document.createElement('span');
};

/**
 * Replaces anchor with span.
 * @param  {!HTMLAnchorElement} anchor Anchor element.
 * @param  {!HTMLSpanElement} span Span element.
 * @return {void}
 */
var replaceAnchorWithSpan = function replaceAnchorWithSpan(anchor, span) {
  return anchor.parentNode.replaceChild(span, anchor);
};

/**
 * Hides red link anchors in either a document or a document fragment so they are unclickable and
 * unfocusable.
 * @param {!Document} document Document in which to hide red links.
 * @param {?DocumentFragment} fragment If specified, red links are hidden in the fragment and the
 * document is used only for span cloning.
 * @return {void}
 */
var hideRedLinks = function hideRedLinks(document, fragment) {
  var spanTemplate = newRedLinkTemplate(document);
  var content = fragment !== undefined ? fragment : document;
  redLinkAnchorsInContent(content).forEach(function (redLink) {
    var span = spanTemplate.cloneNode(false);
    configureRedLinkTemplate(span, redLink);
    replaceAnchorWithSpan(redLink, span);
  });
};

var RedLinks = {
  hideRedLinks: hideRedLinks,
  test: {
    configureRedLinkTemplate: configureRedLinkTemplate,
    redLinkAnchorsInContent: redLinkAnchorsInContent,
    newRedLinkTemplate: newRedLinkTemplate,
    replaceAnchorWithSpan: replaceAnchorWithSpan
  }
};

/**
 * To widen an image element a css class called 'wideImageOverride' is applied to the image element,
 * however, ancestors of the image element can prevent the widening from taking effect. This method
 * makes minimal adjustments to ancestors of the image element being widened so the image widening
 * can take effect.
 * @param  {!HTMLElement} el Element whose ancestors will be widened
 * @return {void}
 */
var widenAncestors = function widenAncestors(el) {
  for (var parentElement = el.parentElement; parentElement && !parentElement.classList.contains('content_block'); parentElement = parentElement.parentElement) {
    if (parentElement.style.width) {
      parentElement.style.width = '100%';
    }
    if (parentElement.style.maxWidth) {
      parentElement.style.maxWidth = '100%';
    }
    if (parentElement.style.float) {
      parentElement.style.float = 'none';
    }
  }
};

/**
 * Some images should not be widened. This method makes that determination.
 * @param  {!HTMLElement} image   The image in question
 * @return {boolean}              Whether 'image' should be widened
 */
var shouldWidenImage = function shouldWidenImage(image) {
  // Images within a "<div class='noresize'>...</div>" should not be widened.
  // Example exhibiting links overlaying such an image:
  //   'enwiki > Counties of England > Scope and structure > Local government'
  if (elementUtilities.findClosestAncestor(image, "[class*='noresize']")) {
    return false;
  }

  // Side-by-side images should not be widened. Often their captions mention 'left' and 'right', so
  // we don't want to widen these as doing so would stack them vertically.
  // Examples exhibiting side-by-side images:
  //    'enwiki > Cold Comfort (Inside No. 9) > Casting'
  //    'enwiki > Vincent van Gogh > Letters'
  if (elementUtilities.findClosestAncestor(image, "div[class*='tsingle']")) {
    return false;
  }

  // Imagemaps, which expect images to be specific sizes, should not be widened.
  // Examples can be found on 'enwiki > Kingdom (biology)':
  //    - first non lead image is an image map
  //    - 'Three domains of life > Phylogenetic Tree of Life' image is an image map
  if (image.hasAttribute('usemap')) {
    return false;
  }

  // Images in tables should not be widened - doing so can horribly mess up table layout.
  if (elementUtilities.isNestedInTable(image)) {
    return false;
  }

  return true;
};

/**
 * Widens the image.
 * @param  {!HTMLElement} image   The image in question
 * @return {void}
 */
var widenImage = function widenImage(image) {
  widenAncestors(image);
  image.classList.add('wideImageOverride');
};

/**
 * Widens an image if the image is found to be fit for widening.
 * @param  {!HTMLElement} image   The image in question
 * @return {boolean}              Whether or not 'image' was widened
 */
var maybeWidenImage = function maybeWidenImage(image) {
  if (shouldWidenImage(image)) {
    widenImage(image);
    return true;
  }
  return false;
};

var WidenImage = {
  maybeWidenImage: maybeWidenImage,
  test: {
    shouldWidenImage: shouldWidenImage,
    widenAncestors: widenAncestors
  }
};

var pagelib$1 = {
  CollapseTable: CollapseTable,
  LazyLoadTransform: LazyLoadTransform,
  LazyLoadTransformer: _class$1,
  RedLinks: RedLinks,
  WidenImage: WidenImage,
  test: {
    ElementUtilities: elementUtilities, EventThrottle: _class, Polyfill: Polyfill, Rectangle: _class$2, Throttle: Throttle
  }
};

// This file exists for CSS packaging only. It imports the override CSS
// JavaScript index file, which also exists only for packaging, as well as the
// real JavaScript, transform/index, it simply re-exports.

return pagelib$1;

})));


},{}],2:[function(require,module,exports){
var bridge = require('./bridge');
var util = require('./utilities');

function ActionsHandler() {
}

var actionHandlers = {};

ActionsHandler.prototype.register = function( action, fun ) {
    if ( action in actionHandlers ) {
        actionHandlers[action].push( fun );
    } else {
        actionHandlers[action] = [ fun ];
    }
};

bridge.registerListener( "handleReference", function( payload ) {
    handleReference( payload.anchor, false );
});

function handleReference( targetId, backlink ) {
    var targetElem = document.getElementById( targetId );
    if ( targetElem === null ) {
        console.log( "reference target not found: " + targetId );
    } else if ( !backlink && targetId.slice(0, 4).toLowerCase() === "cite" ) { // treat "CITEREF"s the same as "cite_note"s
        try {
            var refTexts = targetElem.getElementsByClassName( "reference-text" );
            if ( refTexts.length > 0 ) {
                targetElem = refTexts[0];
            }
            bridge.sendMessage( 'referenceClicked', { "ref": targetElem.innerHTML } );
        } catch (e) {
            targetElem.scrollIntoView();
        }
    } else {
        // If it is a link to another anchor in the current page, just scroll to it
        targetElem.scrollIntoView();
    }
}

/**
 * Either gets the title from the title attribute (for mobileview case and newer MCS pages) or,
 * if that doesn't not exists try to derive it from the href attribute value.
 * In the latter case it also unescapes HTML entities to get the correct title string.
 */
function getTitle( sourceNode, href ) {
    if (sourceNode.hasAttribute( "title" )) {
        return sourceNode.getAttribute( "title" );
    } else {
        return href.replace(/^\/wiki\//, '').replace(/^\.\//, '').replace(/#.*$/, '');
    }
}

document.onclick = function() {
    var sourceNode = null;
    var curNode = event.target;
    // If an element was clicked, check if it or any of its parents are <a>
    // This handles cases like <a>foo</a>, <a><strong>foo</strong></a>, etc.
    while (curNode) {
        if (curNode.tagName === "A" || curNode.tagName === "AREA") {
            sourceNode = curNode;
            break;
        }
        curNode = curNode.parentNode;
    }

    if (sourceNode) {
        if ( sourceNode.hasAttribute( "data-action" ) ) {
            var action = sourceNode.getAttribute( "data-action" );
            var handlers = actionHandlers[ action ];
            for ( var i = 0; i < handlers.length; i++ ) {
                handlers[i]( sourceNode, event );
            }
        } else {
            var href = sourceNode.getAttribute( "href" );
            if ( href[0] === "#" ) {
                var targetId = href.slice(1);
                handleReference( targetId, util.ancestorContainsClass( sourceNode, "mw-cite-backlink" ) );
            } else if (sourceNode.classList.contains( 'app_media' )) {
                bridge.sendMessage( 'mediaClicked', { "href": href } );
            } else if (sourceNode.classList.contains( 'image' )) {
                bridge.sendMessage( 'imageClicked', { "href": href } );
            } else {
                bridge.sendMessage( 'linkClicked', { "href": href, "title": getTitle(sourceNode, href) } );
            }
            event.preventDefault();
        }
    }
};

module.exports = new ActionsHandler();

},{"./bridge":3,"./utilities":25}],3:[function(require,module,exports){
function Bridge() {
}

var eventHandlers = {};

// This is called directly from Java
window.handleMessage = function( type, msgPointer ) {
    var that = this;
    var payload = JSON.parse( marshaller.getPayload( msgPointer ) );
    if ( eventHandlers.hasOwnProperty( type ) ) {
        eventHandlers[type].forEach( function( callback ) {
            callback.call( that, payload );
        } );
    }
};

Bridge.prototype.registerListener = function( messageType, callback ) {
    if ( eventHandlers.hasOwnProperty( messageType ) ) {
        eventHandlers[messageType].push( callback );
    } else {
        eventHandlers[messageType] = [ callback ];
    }
};

Bridge.prototype.sendMessage = function( messageType, payload ) {
    var messagePack = { type: messageType, payload: payload };
    var ret = window.prompt( encodeURIComponent(JSON.stringify( messagePack )) );
    if ( ret ) {
        return JSON.parse( ret );
    }
};

module.exports = new Bridge();
// FIXME: Move this to somewhere else, eh?
window.onload = function() {
    module.exports.sendMessage( "DOMLoaded", {} );
};
},{}],4:[function(require,module,exports){
module.exports = {
    DARK_STYLE_FILENAME: "file:///android_asset/dark.css"
}
},{}],5:[function(require,module,exports){
var bridge = require("./bridge");
var constant = require("./constant");
var loader = require("./loader");
var utilities = require("./utilities");

function setImageBackgroundsForDarkMode( content ) {
    var img, allImgs = content.querySelectorAll( 'img' );
    for ( var i = 0; i < allImgs.length; i++ ) {
        img = allImgs[i];
        if ( likelyExpectsLightBackground( img ) ) {
            img.style.background = '#fff';
        }
    }
    // and now, look for Math formula images, and invert them
    var mathImgs = content.querySelectorAll( "[class*='math-fallback']" );
    for ( i = 0; i < mathImgs.length; i++ ) {
        var mathImg = mathImgs[i];
        // KitKat and higher can use webkit to invert colors
        if (window.apiLevel >= 19) {
            mathImg.style.cssText = mathImg.style.cssText + ";-webkit-filter: invert(100%);";
        } else {
            // otherwise, just give it a mild background color
            mathImg.style.backgroundColor = "#ccc";
            // and give it a little padding, since the text is right up against the edge.
            mathImg.style.padding = "2px";
        }
    }
}

/**
/ An heuristic for determining whether an element tagged 'img' is likely to need a white background applied
/ (provided a predefined background color is not supplied).
/
/ Based on trial, error and observation, this is likely to be the case when a background color is not
/ explicitly supplied, and:
/
/ (1) The element is in the infobox; or
/ (2) The element is not in a table.  ('img' elements in tables are frequently generated by random
/         templates and should not be altered; see, e.g., T85646).
*/
function likelyExpectsLightBackground( element ) {
    return !hasPredefinedBackgroundColor( element ) && ( isInfoboxImage( element ) || isNotInTable( element ) );
}

function hasPredefinedBackgroundColor( element ) {
    return utilities.ancestorHasStyleProperty( element, 'background-color' );
}

function isInfoboxImage( element ) {
    return utilities.ancestorContainsClass( element, 'image' ) && utilities.ancestorContainsClass( element, 'infobox' );
}

function isNotInTable( element ) {
    return !utilities.isNestedInTable( element );
}

function toggle( darkCSSURL, hasPageLoaded ) {
    window.isDarkMode = !window.isDarkMode;

    // Remove the <style> tag if it exists, add it otherwise
    var darkStyle = document.querySelector( "link[href='" + darkCSSURL + "']" );
    if ( darkStyle ) {
        darkStyle.parentElement.removeChild( darkStyle );
    } else {
        loader.addStyleLink( darkCSSURL );
    }

    if ( hasPageLoaded ) {
        // If we are doing this before the page has loaded, no need to swap colors ourselves
        // If we are doing this after, that means the transforms in transformers.js won't run
        // And we have to do this ourselves
        setImageBackgroundsForDarkMode( document.querySelector( '.content' ) );
    }
}

bridge.registerListener( 'toggleDarkMode', function( payload ) {
    toggle( constant.DARK_STYLE_FILENAME, payload.hasPageLoaded );
} );

module.exports = {
    setImageBackgroundsForDarkMode: setImageBackgroundsForDarkMode
};

},{"./bridge":3,"./constant":4,"./loader":9,"./utilities":25}],6:[function(require,module,exports){
var transformer = require('./transformer');

transformer.register( 'displayDisambigLink', function( content ) {
    var hatnotes = content.querySelectorAll( "div.hatnote" );
    if ( hatnotes.length > 0 ) {
        var container = document.getElementById( "issues_container" );
        var wrapper = document.createElement( 'div' );
        var i = 0,
            len = hatnotes.length;
        for (; i < len; i++) {
            wrapper.appendChild( hatnotes[i] );
        }
        container.appendChild( wrapper );
    }
    return content;
} );

},{"./transformer":15}],7:[function(require,module,exports){
var actions = require('./actions');
var bridge = require('./bridge');

actions.register( "edit_section", function( el, event ) {
    bridge.sendMessage( 'editSectionClicked', { sectionID: el.getAttribute( 'data-id' ) } );
    event.preventDefault();
} );

},{"./actions":2,"./bridge":3}],8:[function(require,module,exports){
var transformer = require('./transformer');

transformer.register( 'displayIssuesLink', function( content ) {
    var issues = content.querySelectorAll( "table.ambox:not([class*='ambox-multiple_issues']):not([class*='ambox-notice'])" );
    if ( issues.length > 0 ) {
        var el = issues[0];
        var container = document.getElementById( "issues_container" );
        var wrapper = document.createElement( 'div' );
        el.parentNode.replaceChild( wrapper, el );
        var i = 0,
            len = issues.length;
        for (; i < len; i++) {
            wrapper.appendChild( issues[i] );
        }
        container.appendChild( wrapper );
    }
    return content;
} );

},{"./transformer":15}],9:[function(require,module,exports){
function addStyleLink( href ) {
    var link = document.createElement( "link" );
    link.setAttribute( "rel", "stylesheet" );
    link.setAttribute( "type", "text/css" );
    link.setAttribute( "charset", "UTF-8" );
    link.setAttribute( "href", href );
    document.getElementsByTagName( "head" )[0].appendChild( link );
}

module.exports = {
    addStyleLink: addStyleLink
};
},{}],10:[function(require,module,exports){
var bridge = require( "./bridge" );
var transformer = require("./transformer");

bridge.registerListener( "setPageProtected", function( payload ) {
    var el = document.getElementsByTagName( "html" )[0];
    if (!el.classList.contains("page-protected") && payload.protect) {
        el.classList.add("page-protected");
    }
    else if (el.classList.contains("page-protected") && !payload.protect) {
        el.classList.remove("page-protected");
    }
    if (!el.classList.contains("no-editing") && payload.noedit) {
        el.classList.add("no-editing");
    }
    else if (el.classList.contains("no-editing") && !payload.noedit) {
        el.classList.remove("no-editing");
    }
} );

bridge.registerListener( "setDecorOffset", function( payload ) {
    transformer.setDecorOffset(payload.offset);
} );

},{"./bridge":3,"./transformer":15}],11:[function(require,module,exports){
var bridge = require("./bridge");

/*
OnClick handler function for IPA spans.
*/
function ipaClickHandler() {
    var container = this;
    bridge.sendMessage( "ipaSpan", { "contents": container.innerHTML });
}

function addIPAonClick( content ) {
    var spans = content.querySelectorAll( "span.ipa_button" );
    for (var i = 0; i < spans.length; i++) {
        var parent = spans[i].parentNode;
        parent.onclick = ipaClickHandler;
    }
}

module.exports = {
    addIPAonClick: addIPAonClick
};
},{"./bridge":3}],12:[function(require,module,exports){
var bridge = require("./bridge");

bridge.registerListener( "displayPreviewHTML", function( payload ) {
    var content = document.getElementById( "content" );
    document.head.getElementsByTagName("base")[0].setAttribute("href", payload.siteBaseUrl);
    content.setAttribute( "dir", window.directionality );
    content.innerHTML = payload.html;
} );

},{"./bridge":3}],13:[function(require,module,exports){
var bridge = require("./bridge");

bridge.registerListener( "setDirectionality", function( payload ) {
    window.directionality = payload.contentDirection;
    var html = document.getElementsByTagName( "html" )[0];
    // first, remove all the possible directionality classes...
    html.classList.remove( "content-rtl" );
    html.classList.remove( "content-ltr" );
    html.classList.remove( "ui-rtl" );
    html.classList.remove( "ui-ltr" );
    // and then set the correct class based on our payload.
    html.classList.add( "content-" + window.directionality );
    html.classList.add( "ui-" + payload.uiDirection );
} );

},{"./bridge":3}],14:[function(require,module,exports){
var bridge = require("./bridge");
var transformer = require("./transformer");
var clickHandlerSetup = require("./onclick");
var pagelib = require("wikimedia-page-library");
var lazyLoadViewportDistanceMultiplier = 2; // Load images on the current screen up to one ahead.
var lazyLoadTransformer = new pagelib.LazyLoadTransformer(window, lazyLoadViewportDistanceMultiplier);

bridge.registerListener( "clearContents", function() {
    clearContents();
});

bridge.registerListener( "setMargins", function( payload ) {
    document.getElementById( "content" ).style.marginTop = payload.marginTop + "px";
    document.getElementById( "content" ).style.marginLeft = payload.marginLeft + "px";
    document.getElementById( "content" ).style.marginRight = payload.marginRight + "px";
});

bridge.registerListener( "setPaddingTop", function( payload ) {
    document.getElementById( "content" ).style.paddingTop = payload.paddingTop + "px";
});

bridge.registerListener( "setPaddingBottom", function( payload ) {
    document.getElementById( "content" ).style.paddingBottom = payload.paddingBottom + "px";
});

bridge.registerListener( "beginNewPage", function( payload ) {
    clearContents();
    // fire an event back to the app, but with a slight timeout, which should
    // have the effect of "waiting" until the page contents have cleared before sending the
    // event, allowing synchronization of sorts between the WebView and the app.
    // (If we find a better way to synchronize the two, it can be done here, as well)
    setTimeout( function() {
        bridge.sendMessage( "onBeginNewPage", payload );
    }, 10);
});

function getLeadParagraph() {
    var text = "";
    var plist = document.getElementsByTagName( "p" );
    if (plist.length > 0) {
        text = plist[0].innerText;
    }
    return text;
}

// Returns currently highlighted text.
// If fewer than two characters are highlighted, returns the text of the first paragraph.
bridge.registerListener( "getTextSelection", function( payload ) {
    var text = window.getSelection().toString().trim();
    if (text.length < 2 && payload.purpose === "share") {
        text = getLeadParagraph();
    }
    if (text.length > 250) {
        text = text.substring(0, 249);
    }
    if (payload.purpose === "edit_here") {
        var range = window.getSelection().getRangeAt(0);
        var newRangeStart = Math.max(0, range.startOffset - 20);
        range.setStart(range.startContainer, newRangeStart);
        text = range.toString();
    }
    bridge.sendMessage( "onGetTextSelection", { "purpose" : payload.purpose, "text" : text, "sectionID" : getCurrentSection() } );
});

bridge.registerListener( "displayLeadSection", function( payload ) {
    var lazyDocument;

    // This might be a refresh! Clear out all contents!
    clearContents();

    // create an empty div to act as the title anchor
    var titleDiv = document.createElement( "div" );
    titleDiv.id = "heading_" + payload.section.id;
    titleDiv.setAttribute( "data-id", 0 );
    titleDiv.className = "section_heading";
    document.getElementById( "content" ).appendChild( titleDiv );

    var issuesContainer = document.createElement( "div" );
    issuesContainer.setAttribute( "dir", window.directionality );
    issuesContainer.id = "issues_container";
    document.getElementById( "content" ).appendChild( issuesContainer );

    window.apiLevel = payload.apiLevel;
    window.string_table_infobox = payload.string_table_infobox;
    window.string_table_other = payload.string_table_other;
    window.string_table_close = payload.string_table_close;
    window.string_expand_refs = payload.string_expand_refs;
    window.pageTitle = payload.title;
    window.isMainPage = payload.isMainPage;
    window.isFilePage = payload.isFilePage;
    window.fromRestBase = payload.fromRestBase;
    window.isBeta = payload.isBeta;
    window.siteLanguage = payload.siteLanguage;
    window.isNetworkMetered = payload.isNetworkMetered;

    lazyDocument = document.implementation.createHTMLDocument( );
    var content = lazyDocument.createElement( "div" );
    content.setAttribute( "dir", window.directionality );
    content.id = "content_block_0";
    content.innerHTML = payload.section.text;

    if (!window.isMainPage) {
        if (!window.isFilePage) {
            lazyLoadTransformer.transform( content );
        }

        if (!window.isNetworkMetered) {
            transformer.transform( "widenImages", content ); // offsetWidth
        }
    }

    document.head.getElementsByTagName("base")[0].setAttribute("href", payload.siteBaseUrl);

    // append the content to the DOM now, so that we can obtain
    // dimension measurements for items.
    document.getElementById( "content" ).appendChild( content );

    // Content service transformations
    if (!window.fromRestBase) {
        transformer.transform( "moveFirstGoodParagraphUp" );

        transformer.transform( "hideRedLinks", content );
        transformer.transform( "anchorPopUpMediaTransforms", content );
        transformer.transform( "hideIPA", content );
    } else {
        clickHandlerSetup.addIPAonClick( content );
    }

    // client only transformations:
    transformer.transform( "addDarkModeStyles", content ); // client setting
    transformer.transform( "setDivWidth", content ); // offsetWidth

    if (!window.isMainPage) {
        transformer.transform( "hideTables", content ); // clickHandler
    }

    transformer.transform("displayDisambigLink", content);
    transformer.transform("displayIssuesLink", content);

    document.getElementById( "loading_sections").className = "loading";

    bridge.sendMessage( "pageInfo", {
      "issues" : collectIssues(),
      "disambiguations" : collectDisambig()
    });
    //if there were no page issues, then hide the container
    if (!issuesContainer.hasChildNodes()) {
        document.getElementById( "content" ).removeChild(issuesContainer);
    }

    scrolledOnLoad = false;
});

function clearContents() {
    lazyLoadTransformer.deregister();
    document.getElementById( "content" ).innerHTML = "";
    window.scrollTo( 0, 0 );
}

function buildEditSectionButton(id) {
    var editButtonWrapper = document.createElement( "span" );
    editButtonWrapper.className = "edit_section_button_wrapper android";
    var editButton = document.createElement( "a" );
    editButton.setAttribute( 'data-id', id );
    editButton.setAttribute( 'data-action', "edit_section" );
    editButton.className = "edit_section_button android";
    editButtonWrapper.appendChild( editButton );
    return editButtonWrapper;
}

function elementsForSection( section ) {
    var lazyDocument;
    var heading = document.createElement( "h" + ( section.toclevel + 1 ) );
    heading.setAttribute( "dir", window.directionality );
    heading.innerHTML = typeof section.line !== "undefined" ? section.line : "";
    heading.id = section.anchor;
    heading.className = "section_heading";
    heading.setAttribute( 'data-id', section.id );

    heading.appendChild( buildEditSectionButton( section.id ) );

    lazyDocument = document.implementation.createHTMLDocument( );
    var content = lazyDocument.createElement( "div" );
    content.setAttribute( "dir", window.directionality );
    content.id = "content_block_" + section.id;
    content.innerHTML = section.text;

    if (!window.isMainPage) {
        if (!window.isFilePage) {
            lazyLoadTransformer.transform( content );
        }

        if (!window.isNetworkMetered) {
            transformer.transform( "widenImages", content ); // offsetWidth
        }
    }

    // Content service transformations
    if (!window.fromRestBase) {
        transformer.transform( "hideRedLinks", content );
        transformer.transform( "anchorPopUpMediaTransforms", content );
        transformer.transform( "hideIPA", content );
    } else {
        clickHandlerSetup.addIPAonClick( content );
    }

    transformer.transform( "addDarkModeStyles", content ); // client setting
    transformer.transform( "setDivWidth", content ); // offsetWidth

    transformer.transform( "hideRefs", content ); // clickHandler

    if (!window.isMainPage) {
        transformer.transform( "hideTables", content ); // clickHandler
    }

    return [ heading, content ];
}

var scrolledOnLoad = false;

bridge.registerListener( "displaySection", function ( payload ) {
    if ( payload.noMore ) {
        // if we still haven't scrolled to our target offset (if we have one),
        // then do it now.
        if (payload.scrollY > 0 && !scrolledOnLoad) {
            window.scrollTo( 0, payload.scrollY );
            scrolledOnLoad = true;
        }
        document.getElementById( "loading_sections").className = "";
        lazyLoadTransformer.loadImages();
        bridge.sendMessage( "pageLoadComplete", {
          "sequence": payload.sequence });
    } else {
        var contentWrapper = document.getElementById( "content" );
        elementsForSection(payload.section).forEach(function (element) {
            contentWrapper.appendChild(element);
            // do we have a y-offset to scroll to?
            if (payload.scrollY > 0 && payload.scrollY < element.offsetTop && !scrolledOnLoad) {
                window.scrollTo( 0, payload.scrollY );
                scrolledOnLoad = true;
            }
        });
        // do we have a section to scroll to?
        if ( typeof payload.fragment === "string" && payload.fragment.length > 0 && payload.section.anchor === payload.fragment) {
            scrollToSection( payload.fragment );
        }
        bridge.sendMessage( "requestSection", { "sequence": payload.sequence, "index": payload.section.id + 1 });
    }
});

bridge.registerListener( "scrollToSection", function ( payload ) {
    scrollToSection( payload.anchor );
});

function collectDisambig() {
    var res = [];
    var links = document.querySelectorAll( 'div.hatnote a' );
    var i = 0,
        len = links.length;
    for (; i < len; i++) {
        // Pass the href; we'll decode it into a proper page title in Java
        res.push( links[i].getAttribute( 'href' ) );
    }
    return res;
}

function collectIssues() {
    var res = [];
    var issues = document.querySelectorAll( 'table.ambox' );
    var i = 0,
        len = issues.length;
    for (; i < len; i++) {
        // .ambox- is used e.g. on eswiki
        res.push( issues[i].querySelector( '.mbox-text, .ambox-text' ).innerHTML );
    }
    return res;
}

function scrollToSection( anchor ) {
    if (anchor === "heading_0") {
        // if it's the first section, then scroll all the way to the top, since there could
        // be a lead image, native title components, etc.
        window.scrollTo( 0, 0 );
    } else {
        var el = document.getElementById( anchor );
        var scrollY = el.offsetTop - transformer.getDecorOffset();
        window.scrollTo( 0, scrollY );
    }
}

bridge.registerListener( "scrollToBottom", function () {
    window.scrollTo(0, document.body.scrollHeight);
});

/**
 * Returns the section id of the section that has the header closest to but above midpoint of screen
 */
function getCurrentSection() {
    var sectionHeaders = document.getElementsByClassName( "section_heading" );
    var topCutoff = window.scrollY + ( document.documentElement.clientHeight / 2 );
    var curClosest = null;
    for ( var i = 0; i < sectionHeaders.length; i++ ) {
        var el = sectionHeaders[i];
        if ( curClosest === null ) {
            curClosest = el;
            continue;
        }
        if ( el.offsetTop >= topCutoff ) {
            break;
        }
        if ( Math.abs(el.offsetTop - topCutoff) < Math.abs(curClosest.offsetTop - topCutoff) ) {
            curClosest = el;
        }
    }

    return curClosest.getAttribute( "data-id" );
}

bridge.registerListener( "requestCurrentSection", function() {
    bridge.sendMessage( "currentSectionResponse", { sectionID: getCurrentSection() } );
} );

},{"./bridge":3,"./onclick":11,"./transformer":15,"wikimedia-page-library":1}],15:[function(require,module,exports){
function Transformer() {
}

var transforms = {};
var decorOffset = 0; // The height of the toolbar and, when translucent, status bar in CSS pixels.

Transformer.prototype.register = function( transform, fun ) {
    if ( transform in transforms ) {
        transforms[transform].push( fun );
    } else {
        transforms[transform] = [ fun ];
    }
};

Transformer.prototype.transform = function( transform, element ) {
    var functions = transforms[transform];
    for ( var i = 0; i < functions.length; i++ ) {
        element = functions[i](element);
    }
};

Transformer.prototype.getDecorOffset = function() {
    return decorOffset;
};

Transformer.prototype.setDecorOffset = function(offset) {
    decorOffset = offset;
};

module.exports = new Transformer();
},{}],16:[function(require,module,exports){
var transformer = require("../transformer");
var dark = require("../dark");

transformer.register( "addDarkModeStyles", function( content ) {
    var html = document.getElementsByTagName( 'html' )[0];
    html.classList.remove( 'dark' );
    if ( window.isDarkMode ) {
        html.classList.add( 'dark' );
        dark.setImageBackgroundsForDarkMode ( content );
    }
} );
},{"../dark":5,"../transformer":15}],17:[function(require,module,exports){
var pagelib = require("wikimedia-page-library");
var transformer = require("../transformer");

function scrollWithDecorOffset(container) {
    window.scrollTo( 0, container.parentNode.offsetTop - transformer.getDecorOffset() );
}

function toggleCollapseClickCallback() {
    pagelib.CollapseTable.toggleCollapseClickCallback.call(this, scrollWithDecorOffset);
}

transformer.register( "hideTables", function(content) {
    pagelib.CollapseTable.collapseTables(window, content, window.pageTitle,
        window.isMainPage, window.string_table_infobox,
        window.string_table_other, window.string_table_close,
        scrollWithDecorOffset);
});

module.exports = {
    handleTableCollapseOrExpandClick: toggleCollapseClickCallback
};

},{"../transformer":15,"wikimedia-page-library":1}],18:[function(require,module,exports){
var transformer = require("../transformer");
var collapseTables = require("./collapseTables");

transformer.register( "hideRefs", function( content ) {
    var refLists = content.querySelectorAll( "div.reflist" );
    for (var i = 0; i < refLists.length; i++) {
        var caption = "<strong class='app_table_collapsed_caption'>" + window.string_expand_refs + "</strong>";

        //create the container div that will contain both the original table
        //and the collapsed version.
        var containerDiv = document.createElement( 'div' );
        containerDiv.className = 'app_table_container';
        refLists[i].parentNode.insertBefore(containerDiv, refLists[i]);
        refLists[i].parentNode.removeChild(refLists[i]);

        //create the collapsed div
        var collapsedDiv = document.createElement( 'div' );
        collapsedDiv.classList.add('app_table_collapsed_container');
        collapsedDiv.classList.add('app_table_collapsed_open');
        collapsedDiv.innerHTML = caption;

        //create the bottom collapsed div
        var bottomDiv = document.createElement( 'div' );
        bottomDiv.classList.add('app_table_collapsed_bottom');
        bottomDiv.classList.add('app_table_collapse_icon');
        bottomDiv.innerHTML = window.string_table_close;

        //add our stuff to the container
        containerDiv.appendChild(collapsedDiv);
        containerDiv.appendChild(refLists[i]);
        containerDiv.appendChild(bottomDiv);

        //give it just a little padding
        refLists[i].style.padding = "4px";

        //set initial visibility
        refLists[i].style.display = 'none';
        collapsedDiv.style.display = 'block';
        bottomDiv.style.display = 'none';

        //assign click handler to the collapsed divs
        collapsedDiv.onclick = collapseTables.handleTableCollapseOrExpandClick;
        bottomDiv.onclick = collapseTables.handleTableCollapseOrExpandClick;
    }
} );
},{"../transformer":15,"./collapseTables":17}],19:[function(require,module,exports){
var transformer = require("../../transformer");

transformer.register( "anchorPopUpMediaTransforms", function( content ) {
    // look for video thumbnail containers (divs that have class "PopUpMediaTransform"),
    // and enclose them in an anchor that will lead to the correct click handler...
    var mediaDivs = content.querySelectorAll( 'div.PopUpMediaTransform' );
    for ( var i = 0; i < mediaDivs.length; i++ ) {
        var mediaDiv = mediaDivs[i];
        var imgTags = mediaDiv.querySelectorAll( 'img' );
        if (imgTags.length === 0) {
            continue;
        }
        // the first img element is the video thumbnail, and its 'alt' attribute is
        // the file name of the video!
        if (!imgTags[0].getAttribute( 'alt' )) {
            continue;
        }
        // also, we should hide the "Play media" link that appears under the thumbnail,
        // since we don't need it.
        var aTags = mediaDiv.querySelectorAll( 'a' );
        if (aTags.length > 0) {
            aTags[0].parentNode.removeChild(aTags[0]);
        }
        var containerLink = document.createElement( 'a' );
        containerLink.setAttribute( 'href', imgTags[0].getAttribute( 'alt' ) );
        containerLink.classList.add( 'app_media' );
        mediaDiv.parentNode.insertBefore(containerLink, mediaDiv);
        mediaDiv.parentNode.removeChild(mediaDiv);
        containerLink.appendChild(imgTags[0]);
    }
} );

},{"../../transformer":15}],20:[function(require,module,exports){
var transformer = require("../../transformer");
var bridge = require("../../bridge");

/*
OnClick handler function for IPA spans.
*/
function ipaClickHandler() {
    var container = this;
    bridge.sendMessage( "ipaSpan", { "contents": container.innerHTML });
}

transformer.register( "hideIPA", function( content ) {
    var spans = content.querySelectorAll( "span.IPA" );
    for (var i = 0; i < spans.length; i++) {
        var parentSpan = spans[i].parentNode;
        if (parentSpan === null) {
            continue;
        }
        var doTransform = false;
        // case 1: we have a sequence of IPA spans contained in a parent "nowrap" span
        if (parentSpan.tagName === "SPAN" && spans[i].classList.contains('nopopups')) {
            doTransform = true;
        }
        if (parentSpan.style.display === 'none') {
            doTransform = false;
        }
        if (!doTransform) {
            continue;
        }

        //we have a new IPA span!

        var containerSpan = document.createElement( 'span' );
        parentSpan.parentNode.insertBefore(containerSpan, parentSpan);
        parentSpan.parentNode.removeChild(parentSpan);

        //create and add the button
        var buttonDiv = document.createElement( 'div' );
        buttonDiv.classList.add('ipa_button');
        containerSpan.appendChild(buttonDiv);
        containerSpan.appendChild(parentSpan);

        //set initial visibility
        parentSpan.style.display = 'none';
        //and assign the click handler to it
        containerSpan.onclick = ipaClickHandler;
    }
} );
},{"../../bridge":3,"../../transformer":15}],21:[function(require,module,exports){
var transformer = require("../../transformer");

transformer.register( "hideRedLinks", function( content ) {
    var redLinks = content.querySelectorAll( 'a.new' );
    for ( var i = 0; i < redLinks.length; i++ ) {
        var redLink = redLinks[i];
        var replacementSpan = document.createElement( 'span' );
        replacementSpan.innerHTML = redLink.innerHTML;
        replacementSpan.setAttribute( 'class', redLink.getAttribute( 'class' ) );
        redLink.parentNode.replaceChild( replacementSpan, redLink );
    }
} );
},{"../../transformer":15}],22:[function(require,module,exports){
var transformer = require("../../transformer");

// Move the first non-empty paragraph (and related elements) to the top of the section.
// This will have the effect of shifting the infobox and/or any images at the top of the page
// below the first paragraph, allowing the user to start reading the page right away.
transformer.register( "moveFirstGoodParagraphUp", function() {
    if ( window.isMainPage ) {
        // don't do anything if this is the main page, since many wikis
        // arrange the main page in a series of tables.
        return;
    }
    var block_0 = document.getElementById( "content_block_0" );
    if ( !block_0 ) {
        return;
    }

    var block_0_children = block_0.childNodes;
    if ( !block_0_children ) {
        return;
    }

    var leadSpan = createLeadSpan(block_0_children);
    block_0.insertBefore( leadSpan, block_0.firstChild );
} );

// Create a lead span to be moved to the top of the page, consisting of the first
// qualifying <p> element encountered and any subsequent non-<p> elements until
// the next <p> is encountered.
//
// Simply moving the first <p> element up may result in elements appearing
// between the first paragraph as designated by <p></p> tags and other elements
// (such as an unnumbered list) that may also be intended as part of the first
// display paragraph.  See T111958.
function createLeadSpan( childNodes ) {
    var leadSpan = document.createElement( 'span' );
    var firstGoodParagraphIndex = findFirstGoodParagraphIn( childNodes );

    if ( firstGoodParagraphIndex ) {
        addNode( leadSpan, childNodes[ firstGoodParagraphIndex ] );
        addTrailingNodes(leadSpan, childNodes, firstGoodParagraphIndex + 1 );
    }

    return leadSpan;
}

function findFirstGoodParagraphIn( nodes ) {
    var minParagraphHeight = 24;
    var firstGoodParagraphIndex;
    var i;

    for ( i = 0; i < nodes.length; i++ ) {
        if ( nodes[i].tagName === 'P' ) {
            // Ensure the P being pulled up has at least a couple lines of text.
            // Otherwise silly things like a empty P or P which only contains a
            // BR tag will get pulled up (see articles on "Chemical Reaction" and
            // "Hawaii").
            // Trick for quickly determining element height:
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.offsetHeight
            // http://stackoverflow.com/a/1343350/135557
            if ( nodes[i].offsetHeight < minParagraphHeight ){
                continue;
            }
            firstGoodParagraphIndex = i;
            break;
        }
    }

    return firstGoodParagraphIndex;
}

function addNode( span, node ) {
    span.appendChild( node.parentNode.removeChild( node ) );
}

function addTrailingNodes( span, nodes, startIndex ) {
    for ( var i = startIndex; i < nodes.length; i++ ) {
        if ( nodes[i].tagName === 'P' ) {
            break;
        }
        addNode( span, nodes[i] );
    }
}

},{"../../transformer":15}],23:[function(require,module,exports){
var transformer = require("../transformer");

transformer.register( "setDivWidth", function( content ) {
    var allDivs = content.querySelectorAll( 'div' );
    var contentWrapper = document.getElementById( "content" );
    var clientWidth = contentWrapper.offsetWidth;
    for ( var i = 0; i < allDivs.length; i++ ) {
        if (allDivs[i].style && allDivs[i].style.width) {
            // if this div has an explicit width, and it's greater than our client width,
            // then make it overflow (with scrolling), and reset its width to 100%
            if (parseInt(allDivs[i].style.width) > clientWidth) {
                allDivs[i].style.overflowX = "auto";
                allDivs[i].style.width = "100%";
            }
        }
    }
} );
},{"../transformer":15}],24:[function(require,module,exports){
var maybeWidenImage = require('wikimedia-page-library').WidenImage.maybeWidenImage;
var transformer = require("../transformer");
var utilities = require("../utilities");

var maxStretchRatioAllowedBeforeRequestingHigherResolution = 1.3;

function isGalleryImage(image) {
  return (
      image.width >= 64 &&
      image.parentNode.className === "image"
    );
}

function getStretchRatio(image) {
    var widthControllingDiv = utilities.firstDivAncestor(image);
    if (widthControllingDiv) {
        return (widthControllingDiv.offsetWidth / image.naturalWidth);
    }
    return 1.0;
}

function useHigherResolutionImageSrcFromSrcsetIfNecessary(image) {
    if (image.getAttribute('srcset')) {
        var stretchRatio = getStretchRatio(image);
        if (stretchRatio > maxStretchRatioAllowedBeforeRequestingHigherResolution) {
            var srcsetDict = utilities.getDictionaryFromSrcset(image.getAttribute('srcset'));
            /*
            Grab the highest res url from srcset - avoids the complexity of parsing urls
            to retrieve variants - which can get tricky - canonicals have different paths
            than size variants
            */
            var largestSrcsetDictKey = Object.keys(srcsetDict).reduce(function(a, b) {
              return a > b ? a : b;
            });

            image.src = srcsetDict[largestSrcsetDictKey];
        }
    }
}

function onImageLoad() {
    var image = this;
    image.removeEventListener('load', onImageLoad, false);
    if (isGalleryImage(image) && maybeWidenImage(image)) {
        useHigherResolutionImageSrcFromSrcsetIfNecessary(image);
    }
}

transformer.register( "widenImages", function( content ) {
    var images = content.querySelectorAll( 'img' );
    for ( var i = 0; i < images.length; i++ ) {
        // Load event used so images w/o style or inline width/height
        // attributes can still have their size determined reliably.
        images[i].addEventListener('load', onImageLoad, false);
    }
} );

},{"../transformer":15,"../utilities":25,"wikimedia-page-library":1}],25:[function(require,module,exports){

function hasAncestor( el, tagName ) {
    if (el !== null && el.tagName === tagName) {
        return true;
    } else {
        if ( el.parentNode !== null && el.parentNode.tagName !== 'BODY' ) {
            return hasAncestor( el.parentNode, tagName );
        } else {
            return false;
        }
    }
}

function ancestorContainsClass( element, className ) {
    var contains = false;
    var curNode = element;
    while (curNode) {
        if (typeof curNode.classList !== "undefined") {
            if (curNode.classList.contains(className)) {
                contains = true;
                break;
            }
        }
        curNode = curNode.parentNode;
    }
    return contains;
}

function ancestorHasStyleProperty( element, styleProperty ) {
    var hasStyleProperty = false;
    var curNode = element;
    while (curNode) {
        if (typeof curNode.classList !== "undefined") {
            if (curNode.style[styleProperty]) {
                hasStyleProperty = true;
                break;
            }
        }
        curNode = curNode.parentNode;
    }
    return hasStyleProperty;
}

function getDictionaryFromSrcset(srcset) {
    /*
    Returns dictionary with density (without "x") as keys and urls as values.
    Parameter 'srcset' string:
        '//image1.jpg 1.5x, //image2.jpg 2x, //image3.jpg 3x'
    Returns dictionary:
        {1.5: '//image1.jpg', 2: '//image2.jpg', 3: '//image3.jpg'}
    */
    var sets = srcset.split(',').map(function(set) {
        return set.trim().split(' ');
    });
    var output = {};
    sets.forEach(function(set) {
        output[set[1].replace('x', '')] = set[0];
    });
    return output;
}

function firstDivAncestor (el) {
    while ((el = el.parentElement)) {
        if (el.tagName === 'DIV') {
            return el;
        }
    }
    return null;
}

function firstAncestorWithMultipleChildren (el) {
    while ((el = el.parentElement) && (el.childElementCount === 1)){}
    return el;
}

function isNestedInTable(el) {
    while ((el = el.parentElement)) {
        if (el.tagName === 'TD') {
            return true;
        }
    }
    return false;
}

module.exports = {
    hasAncestor: hasAncestor,
    ancestorContainsClass: ancestorContainsClass,
    ancestorHasStyleProperty: ancestorHasStyleProperty,
    getDictionaryFromSrcset: getDictionaryFromSrcset,
    firstDivAncestor: firstDivAncestor,
    isNestedInTable: isNestedInTable,
    firstAncestorWithMultipleChildren: firstAncestorWithMultipleChildren
};

},{}]},{},[3,10,25,15,16,17,18,23,24,19,20,21,22,2,6,7,8,9,5,12,13,14]);
