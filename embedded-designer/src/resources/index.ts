import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources([
    './elements/header.html',
    './elements/toolbar.html',
    './elements/design-toolbar.html',
    './elements/designer.html',
    './elements/design-element',
    './elements/action-element',
    './elements/properties-window.html'
  ]);
}
