"use strict";
const gulp = require('gulp');
const vulcanize = require('gulp-vulcanize');
const rename = require('gulp-rename');
const $ = require('gulp-load-plugins')();
const runSequence = require('run-sequence');
const merge = require('merge-stream');
const minifyInline = require('gulp-minify-inline')
const path = require('path');
const clean = require('gulp-clean');
 
const DIST = 'package';
var dist = function(subpath) {
    return !subpath?DIST:path.join(DIST, subpath);
};
//=====================================================|
var imageOptimizeTask = function(src, dest) {
  return gulp.src(src)
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(dest))
    .pipe($.size({title: 'images'}));
};
var optimizeHtmlTask = function(src, dest) {
  return gulp.src(src)
    // Concatenate and minify JavaScript
    .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
    //.pipe($.if('*.js', babel({presets: ['es2015']})))
    // Concatenate and minify styles
    // In case you are still using useref build blocks
    .pipe($.if('*.css', $.minifyCss()))
    // Minify any HTML
    .pipe($.if('*.html', $.minifyHtml({
      quotes: true,
      empty: true,
      spare: true
    })))
    // Output files
    .pipe(gulp.dest(dest))
    .pipe($.size({
      title: 'html'
    }));
};
//=====================================================|
gulp.task('copy', function() {
    var app = gulp.src([
        'app/*',
        '!app/public/elements.html',
    ], {
        dot: true
    }).pipe(gulp.dest(dist("public")));

    // Copy over only the bower_components we need
    // These are things which cannot be vulcanized
    var bower = gulp.src([
        'bower_components/{webcomponentsjs,promise-polyfill,trianglify,moment}/**/*'
    ]).pipe(gulp.dest(dist('bower_components')));

    return merge(app, bower)
        .pipe($.size({
            title: 'copy'
        }));
});
gulp.task('images', function() {return imageOptimizeTask(['app/public/**/*.png','app/public/**/*.ico','app/public/**/*.jpg'], dist('public'))});
gulp.task('html', function() {return optimizeHtmlTask(
    ['app/*.html'],
    dist())
});
gulp.task('vulcanize', function() {
    return gulp.src('app/public/elements.html')
        .pipe(gulp.dest('app/bower_components'))
        .pipe($.vulcanize({
            stripComments: true,
            inlineCss: true,
            inlineScripts: true
        }))
        .pipe($.if('*.html', $.minifyHtml({
            quotes: true,
            empty: true,
            spare: true
        })))
        .pipe(minifyInline())
        .pipe(gulp.dest(dist('bower_components')))
        .pipe($.size({title: 'vulcanize'}));
});
//=====================================================|
gulp.task('clean', ()=>{
	return gulp.src([dist(),'app/bower_components/elements.*'], {read: false})
		.pipe(clean());
})
//=====================================================|
gulp.task('default', ['clean'], function(cb) {
    runSequence(
        'copy',
        ['jade','images', 'vulcanize'],
        'html'
    cb);
});