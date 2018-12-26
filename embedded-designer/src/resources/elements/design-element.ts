import { bindable, autoinject, bindingMode } from 'aurelia-framework';

@autoinject
export class DesignElement {

    @bindable control: any;

    element: Element;
    
    constructor(element: Element) {
        this.element = element;
    }

    clickOnField(item) {
        this.dispatch('field-onclick', item);
    }

    dispatch(name, data) {
        window.dispatchEvent(
            new CustomEvent(name, {
                bubbles: true,
                detail: data
            })
        );
    }
}