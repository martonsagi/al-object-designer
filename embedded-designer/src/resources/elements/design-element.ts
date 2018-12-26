import { bindable, autoinject, bindingMode } from 'aurelia-framework';

@autoinject
export class DesignElement {

    @bindable control: any;

    element: Element;

    dragOptions: any;

    constructor(element: Element) {
        this.element = element;

        this.dragOptions = {
            draggable: '.designer-input',
            group: 'group',
            disabled: true // turned on locally
        };
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