import { forwardFocus } from './utilities.js';
import * as symbols from './symbols.js';
import * as template from './template.js';
import ArrowDirectionButton from './ArrowDirectionButton.js';
import ReactiveElement from './ReactiveElement.js'; // eslint-disable-line no-unused-vars


const wrap = Symbol('wrap');


/**
 * Adds left and right arrow buttons to a carousel-like component.
 * 
 * @module ArrowDirectionMixin
 * @elementrole {ArrowDirectionButton} arrowButton
 * @param {Constructor<ReactiveElement>} Base
 */
function ArrowDirectionMixin(Base) {

  // The class prototype added by the mixin.
  class ArrowDirection extends Base {

    /**
     * True if the arrow buttons should overlap the component contents;
     * false if they should appear to the side of the contents.
     * 
     * @type {boolean}
     * @default true
     */
    get arrowButtonOverlap() {
      return this.state.arrowButtonOverlap;
    }
    set arrowButtonOverlap(arrowButtonOverlap) {
      const parsed = String(arrowButtonOverlap) === 'true';
      this.setState({
        arrowButtonOverlap: parsed
      });
    }
  
    /**
     * The class, tag, or template used to create the left and right arrow
     * buttons.
     * 
     * @type {Role}
     * @default ArrowDirectionButton
     */
    get arrowButtonRole() {
      return this.state.arrowButtonRole;
    }
    set arrowButtonRole(arrowButtonRole) {
      this.setState({ arrowButtonRole });
    }

    // TODO: Symbols
    arrowButtonLeft() {
      if (super.arrowButtonLeft) {
        return super.arrowButtonLeft();
      } else {
        return this[symbols.goLeft]();
      }
    }

    arrowButtonRight() {
      if (super.arrowButtonRight) {
        return super.arrowButtonRight();
      } else {
        return this[symbols.goRight]();
      }
    }
  
    get defaultState() {
      return Object.assign(super.defaultState, {
        arrowButtonOverlap: true,
        arrowButtonRole: ArrowDirectionButton,
        orientation: 'horizontal',
        showArrowButtons: true
      });
    }

    [symbols.render](/** @type {PlainObject} */ changed) {

      if (changed.arrowButtonRole) {
        if (this.$.arrowButtonLeft instanceof HTMLElement) {
          // Turn off focus handling for old left button.
          forwardFocus(this.$.arrowButtonLeft, null);
        }
        if (this.$.arrowButtonRight instanceof HTMLElement) {
          // Turn off focus handling for old right button.
          forwardFocus(this.$.arrowButtonRight, null);
        }
      }

      if (super[symbols.render]) { super[symbols.render](changed); }

      if (changed.arrowButtonRole) {
        /** @type {any} */
        const cast = this;

        template.transmute(this.$.arrowButtonLeft, this.state.arrowButtonRole);
        if (this.$.arrowButtonLeft instanceof HTMLElement) {
          forwardFocus(this.$.arrowButtonLeft, cast);
        }
        const leftButtonHandler = createButtonHandler(this, () => this.arrowButtonLeft());
        this.$.arrowButtonLeft.addEventListener('mousedown', leftButtonHandler);
        
        template.transmute(this.$.arrowButtonRight, this.state.arrowButtonRole);
        if (this.$.arrowButtonRight instanceof HTMLElement) {
          forwardFocus(this.$.arrowButtonRight, cast);
        }
        const rightButtonHandler = createButtonHandler(this, () => this.arrowButtonRight());
        this.$.arrowButtonRight.addEventListener('mousedown', rightButtonHandler);
      }

      const {
        arrowButtonOverlap,
        canGoLeft,
        canGoRight,
        darkMode
      } = this.state;
      /** @type {any} */ const arrowButtonLeft = this.$.arrowButtonLeft;
      /** @type {any} */ const arrowButtonRight = this.$.arrowButtonRight;

      if (changed.arrowButtonOverlap) {
        const buttonStyle = arrowButtonOverlap ?
          {
            'bottom': 0,
            'position': 'absolute',
            'top': 0,
            'z-index': 1
          } :
          {
            'bottom': null,
            'position': null,
            'top': null,
            'z-index': null
          };
        Object.assign(arrowButtonLeft.style, buttonStyle, {
          left: arrowButtonOverlap ? 0 : ''
        });
        Object.assign(arrowButtonRight.style, buttonStyle, {
          right: arrowButtonOverlap ? 0 : ''
        });
      }

      // Disable the left and right buttons if we can't go in those directions.
      // WORKAROUND: We check to makes sure that canGoLeft/canGoRight state is
      // defined (which happens once the component has items). Without that
      // check, as of May 2019, a Chrome bug prevents the use of this mixin:
      // multiple carousel instances on a page will have their right button
      // initially disabled even when it should be enabled. Safari/Firefox do
      // not exhibit that issue. Since identifying the root cause proved too
      // difficult, this check was added.      
      if (changed.canGoLeft && canGoLeft !== null) {
        arrowButtonLeft.disabled = !canGoLeft;
      }
      // See note for canGoLeft above.
      if (changed.canGoRight && canGoRight !== null) {
        arrowButtonRight.disabled = !canGoRight;
      }
      // Wait for knowledge of dark mode
      if (changed.darkMode && darkMode !== null) {
        // Apply dark mode to buttons.
        if ('darkMode' in arrowButtonLeft) {
          /** @type {any} */ (arrowButtonLeft).darkMode = darkMode;
        }
        if ('darkMode' in arrowButtonRight) {
          /** @type {any} */ (arrowButtonRight).darkMode = darkMode;
        }
      }

      if (changed.rightToLeft) {
        const { rightToLeft } = this.state;
        this.$.arrowDirection.style.flexDirection = rightToLeft ?
          'row-reverse' :
          'row';
      }
      
      if (changed.showArrowButtons) {
        const display = this.state.showArrowButtons ? null : 'none';
        arrowButtonLeft.style.display = display;
        arrowButtonRight.style.display = display;
      }
    }

    get showArrowButtons() {
      return this.state.showArrowButtons;
    }
    set showArrowButtons(showArrowButtons) {
      const parsed = String(showArrowButtons) === 'true';
      this.setState({
        showArrowButtons: parsed
      });
    }

    /**
     * Destructively wrap a node with elements to show arrow buttons.
     * 
     * @param {Node} original - the node that should be wrapped by buttons
     */
    [wrap](original) {
      const arrowDirectionTemplate = template.html`
        <div id="arrowDirection" role="none" style="display: flex; flex: 1; overflow: hidden; position: relative;">
          <div
            id="arrowButtonLeft"
            class="arrowButton"
            aria-hidden="true"
            tabindex="-1"
            >
            <slot name="arrowButtonLeft">
              <svg id="arrowIconLeft" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" style="height: 1em; width: 1em;">
                <g>
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
                </g>
              </svg>
            </slot>
          </div>
          <div id="arrowDirectionContainer" role="none" style="flex: 1; overflow: hidden; position: relative;"></div>
          <div
            id="arrowButtonRight"
            class="arrowButton"
            aria-hidden="true"
            tabindex="-1"
            >
            <slot name="arrowButtonRight">
              <svg id="arrowIconRight" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" style="height: 1em; width: 1em;">
                <g>
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
                </g>
              </svg>
            </slot>
          </div>
        </div>
      `;
      template.wrap(original, arrowDirectionTemplate.content, '#arrowDirectionContainer');
    }
  }

  return ArrowDirection;
}


/**
 * @private
 * @param {ReactiveElement} element
 * @param {function} callback 
 * @returns {EventListener}
 */
function createButtonHandler(element, callback) {
  return async function mousedown(/** @type {Event} */ event) {
    // Only process events for the main (usually left) button.
    /** @type {any} */const cast = event;
    if (cast.button !== 0) {
      return;
    }
    element[symbols.raiseChangeEvents] = true;
    const handled = callback();
    if (handled) {
      event.stopPropagation();
    }
    await Promise.resolve();
    element[symbols.raiseChangeEvents] = false;
  }
}


ArrowDirectionMixin.wrap = wrap;


export default ArrowDirectionMixin;
