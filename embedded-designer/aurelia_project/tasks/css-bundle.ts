import * as gulp from 'gulp';
import * as project from '../aurelia.json';
import {build} from 'aurelia-cli';

export default function bundleCss() {
  return gulp.src(project.bundleCss.source)
    .pipe(build.bundle());
};
