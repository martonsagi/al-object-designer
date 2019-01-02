import { bindable, autoinject, bindingMode } from 'aurelia-framework';

@autoinject
export class ObjectElementBase {

    @bindable control: any;

    element: Element;

    dragOptions: any;

    constructor(element: Element) {
        this.element = element;

        this.dragOptions = {
            animation: 150,
            swapThreshold: 0.5,
            invertedSwapThreshold: 0.5,
            draggable: '.draggable',
            ghostClass: 'dragging',
            chosenClass: 'dropzone',
            dragClass: 'dragging',
            //handle: 'drag-handle',            
            dragoverBubble: true,
        };
    }

    bind(bindingContext: Object,overrideContext: Object) {
        this.dragOptions.group = this.getControlType(this.control);
    }

    attached() {
        
    }

    onMoveField(event) {
        let item = event.detail.item;
        if (!item) {
            return;
        }

        let dataset = item.dataset;
        if (!dataset) {
            return;
        }

        if (!dataset.anchor) {
            return;
        }

        let prevSibling = item.previousElementSibling;
        let nextSibling = item.nextElementSibling;

        if (!prevSibling && !nextSibling) {
            return;
        }

        let data = {
            'anchor': dataset.anchor,
            'before': prevSibling && prevSibling.dataset ? prevSibling.dataset.anchor : null,
            'after': nextSibling && nextSibling.dataset ? nextSibling.dataset.anchor : null,
        }

        this.dispatch('field-onmove', data);        
    }

    onClickField(item) {
        this.dispatch('field-onclick', {
            'anchor': item.SourceCodeAnchor
        });        
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
            let kind = this.getControlKind(item.Kind);
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

    getControlKind(index: number) {
        return ControlKind[index];
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
