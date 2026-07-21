import gulp from 'gulp';
import zip from 'gulp-zip';
import { readFileSync } from 'fs';

let packagePath = './package.json';
let packageFile = readFileSync(packagePath, 'utf8');
let version = JSON.parse(packageFile).version;
let name = JSON.parse(packageFile).name;

function zipBuildFiles(platform = 'chrome', callback = () => {}) {
  // Build Chrome file
  gulp
    .src(['./dist/**/*'], { encoding: false })
    .pipe(zip(`${ name }-${ version }-${ platform }.zip`, { buffer: true }))
    .pipe(gulp.dest('./dist-extension'))
    .on('end', callback); // Execute callback
}

// Start zipping
zipBuildFiles('chrome');