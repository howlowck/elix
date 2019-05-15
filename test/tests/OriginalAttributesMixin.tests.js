import * as symbols from '../../src/symbols.js';
import OriginalAttributesMixin from '../../src/OriginalAttributesMixin.js';
import ReactiveMixin from '../../src/ReactiveMixin.js';


class OriginalAttributesTest extends OriginalAttributesMixin(ReactiveMixin(HTMLElement)) {

  [symbols.render](changed) {
    if (super[symbols.render]) { super[symbols.render](changed); }
    if (changed.originalClasses || changed.originalStyle || changed.selected) {
      const { originalClasses, originalStyle } = this.state;
      const selected = this.state.selected || 
        (originalClasses && originalClasses.selected)
        || false;
      this.classList.toggle('selected', selected);
      const color = selected ?
        'red' :
        (originalStyle && originalStyle.color) || null;
      this.style.color = color;
    }
  }

}
customElements.define('original-attributes-test', OriginalAttributesTest);


describe("OriginalAttributesMixin", function () {

  let container;

  before(() => {
    container = document.getElementById('container');
  });

  afterEach(() => {
    container.innerHTML = '';
  });

  it("doesn't set any state for an element with no attributes, classes, or styles", () => {
    const fixture = new OriginalAttributesTest();
    container.appendChild(fixture);
    assert(fixture.state.original === undefined);
  });

  it("initializes state to track original attributes, classes, and styles", () => {
    container.innerHTML = `<original-attributes-test class="foo bar" style="color: red;" aria-selected="false"></original-attributes-test>`;
    const fixture = container.querySelector('original-attributes-test');
    container.appendChild(fixture);
    assert.deepEqual(fixture.state.originalAttributes, {
      'aria-selected': 'false'
    });
    assert.deepEqual(fixture.state.originalClasses, {
      bar: true,
      foo: true
    });
    assert.deepEqual(fixture.state.originalStyle, {
      color: 'red'
    });
  });

  it("updates host with props", async () => {
    const fixture = new OriginalAttributesTest();
    container.appendChild(fixture);
    assert.equal(fixture.style.color, '');
    await fixture.setState({
      selected: true
    });
    assert.equal(fixture.style.color, 'red');
    await fixture.setState({
      selected: false
    });
    // Should be back to original condition.
    assert.equal(fixture.style.color, '');
  });

  it("tracks original attribute values", () => {
    const fixture = new OriginalAttributesTest();
    fixture.setAttribute('foo', 'bar');
    assert.equal(fixture.state.originalAttributes.foo, 'bar');
    fixture.removeAttribute('foo');
    assert.equal(fixture.state.originalAttributes.foo, undefined);
  });

  it("records state when toggling Boolean attributes", () => {
    const fixture = new OriginalAttributesTest();
    fixture.toggleAttribute('disabled');
    assert.equal(fixture.state.originalAttributes.disabled, '');
    fixture.toggleAttribute('disabled');
    assert.equal(fixture.state.originalAttributes.disabled, undefined);
    fixture.toggleAttribute('disabled', true);
    fixture.toggleAttribute('disabled', true);
    assert.equal(fixture.state.originalAttributes.disabled, '');
    fixture.toggleAttribute('disabled', false);
    fixture.toggleAttribute('disabled', false);
    assert.equal(fixture.state.originalAttributes.disabled, undefined);
  });

  it("merges styles on top of original styles", async () => {
    container.innerHTML = `<original-attributes-test style="background-color: yellow; color: green;"></original-attributes-test>`;
    const fixture = container.querySelector('original-attributes-test');
    await fixture.setState({
      selected: true
    })
    assert.equal(fixture.style.backgroundColor, 'yellow');
    assert.equal(fixture.style.color, 'red');
      
    // Dynamically modify style.
    fixture.setAttribute('style', 'background-color: aqua; color: navy;');
    await Promise.resolve();
    assert.equal(fixture.style.backgroundColor, 'aqua');
    assert.equal(fixture.style.color, 'red');

    await fixture.setState({
      selected: false
    });
    assert.equal(fixture.style.backgroundColor, 'aqua');
    assert.equal(fixture.style.color, 'navy');    
  });

  it("merges classes on top of original classes", async () => {
    container.innerHTML = `<original-attributes-test class='foo'></original-attributes-test>`;
    const fixture = container.querySelector('original-attributes-test');
    assert(fixture.classList.contains('foo'));
    assert(!fixture.classList.contains('selected'));

    await fixture.setState({
      selected: true
    });
    assert(fixture.classList.contains('foo'));
    assert(fixture.classList.contains('selected'));

    await fixture.setState({
      selected: false
    });
    assert(fixture.classList.contains('foo'));
    assert(!fixture.classList.contains('selected'));
  });

  it("respects original classes", async () => {
    container.innerHTML = `<original-attributes-test class='selected'></original-attributes-test>`;
    const fixture = container.querySelector('original-attributes-test');
    assert(fixture.classList.contains('selected'));

    await fixture.setState({
      selected: true
    });
    assert(fixture.classList.contains('selected'));

    await fixture.setState({
      selected: false
    });
    assert(fixture.classList.contains('selected'));
  });

});
