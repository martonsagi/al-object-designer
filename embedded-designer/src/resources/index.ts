import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources([
    './elements/header.html',
    './elements/toolbar.html',
    './elements/designer.html',
    './elements/designelement.html',
    './elements/actionelement.html',
    './elements/objects.html'
  ]);
}
