import * as symbols from './symbols.js';
import * as template from './template.js';
import Button from './Button.js';

/**
 * A button that opens the native share dialog.
 * 
 * `WebShare` is useful creating a mobile-friendly share button.
 * 
 * @inherits Button
 */
class WebShare extends Button {
  get defaultState() {
    return Object.assign(super.defaultState, {
      shareTitle: null,
      shareText: null,
      shareUrl: null
    });
  }

  get shareTitle() {
    return this.state.shareTitle;
  }

  set shareTitle(shareTitle) {
    this.setState({ shareTitle });
  }

  get shareText() {
    return this.state.shareText;
  }

  set shareText(shareText) {
    this.setState({ shareText });
  }

  get shareUrl() {
    return this.state.shareUrl;
  }

  set shareUrl(shareUrl) {
    this.setState({ shareUrl });
  }

  componentDidMount() {
    super.componentDidMount();
    this.$.inner.addEventListener('click', (evt) => {
      if (navigator.share) {
        navigator.share({
            title: this.shareTitle,
            text: this.shareText,
            url: this.shareUrl,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
      }
      else {
        console.log('ooops navigator.share does not exist')
      }
    });
  }

  get [symbols.template]() {
    return template.concat(super[symbols.template], template.html`
      <slot name="buttonInner"></slot>
      <slot name="fallback"></slot>
    `);
  }
}


customElements.define('elix-web-share', WebShare);
export default WebShare;
