import { bindable, autoinject, bindingMode } from 'aurelia-framework';
import { ObjectElementBase } from './object-element-base';

@autoinject
export class DesignElement extends ObjectElementBase {
    
    @bindable control: any;

    constructor(element: Element) {
        super(element);
    }
}
