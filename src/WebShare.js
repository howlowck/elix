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
        return this.state.shareTitle;
    }

    set shareText(shareText) {
        this.setState({ shareText });
    }

    get shareUrl() {
        return this.state.shareTitle;
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
}


customElements.define('elix-web-share', WebShare);
export default WebShare;
