import {Aurelia} from 'aurelia-framework'
import environment from './environment';

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature('resources')
    .plugin('aurelia-sortablejs');

  aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn')
  .plugin('aurelia-ui-virtualization');

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  return aurelia.start().then(() => aurelia.setRoot());
}
