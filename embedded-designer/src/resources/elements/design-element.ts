import { bindable, autoinject, bindingMode } from 'aurelia-framework';

@autoinject
export class DesignElement {

    @bindable control: any;

    element: Element;

    dragOptions: any;

    constructor(element: Element) {
        this.element = element;
    }

    bind(bindingContext: Object,overrideContext: Object) {
        this.dragOptions = {
            draggable: '.draggable',
            group: this.getControlType(this.control),
            //disabled: this.getControlType(this.control) != 'field', // turned on locally
            //bubbleScroll: true,
            dragoverBubble: true,
            //forceFallback: true
        };
    }

    attached() {
        
    }

    clickOnField(event, item) {
        this.dispatch('field-onmove', {
            'anchor': event.detail.item.dataset.anchor,
            'before': '',
            'after': ''
        });
        console.log(event.detail);
    }

    dispatch(name, data) {
        window.dispatchEvent(
            new CustomEvent(name, {
                bubbles: true,
                detail: data
            })
        );
    }

    getControlType(item) {        
        if (!item) {
            return;
        }

        if (item.ControlType) {
            return item.ControlType;
        }

        if (item.Kind) {
            let kind = ControlKind[item.Kind];
            return kind.toLowerCase();
        }
    }

    getCaption(item) {
        if (!item) {
            return;
        }

        if (item.Caption && item.Caption != '') {
            return item.Caption;
        }

        let caption = item.Properties.filter(f => {
            return f.Name == 'CaptionML' || f.Name == 'Caption';
        });

        if (caption.length > 0) {
            return (caption[0].Value as string).substr(4);
        } else {
            return item.Name;
        }
    }
}


enum ControlKind {
    Area,
    Group,
    CueGroup,
    Repeater,
    Fixed,
    Grid,
    Part,
    SystemPart,
    Field,
    Label,
    UserControl,
    ChartPart
}
