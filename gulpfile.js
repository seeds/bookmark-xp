const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const browserSync = require('browser-sync').create()
const concat = require('gulp-concat')
const babel = require('gulp-babel')
const npmDist = require('gulp-npm-dist')
const sourcemaps = require('gulp-sourcemaps')
const jsValidate = require('gulp-jsvalidate')
const terser = require('gulp-terser')
const rename = require('gulp-rename')

function serve () {
  browserSync.init({
    proxy: 'http://localhost:8080/',
    open: false,
    online: true,
    port: 3005
  })
  gulp.watch('./src/main/resources/assets/sass/**/*.scss', css)
  gulp.watch('./src/main/resources/assets/js-src/**/*.js', internalJS)
  gulp.watch('./src/main/resources/assets/js/**/*.js').on('change', browserSync.reload)
  gulp.watch('./src/**/*.html').on('change', browserSync.reload)
}

gulp.task(serve)

// SASS
function css () {
  return (
    gulp
      .src('./src/main/resources/assets/sass/app.scss', { allowEmpty: true })
      .pipe(concat('./styles.min.css'))
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(sass({ outputStyle: 'compressed' }))
      .pipe(terser())
      .pipe(rename({ extname: '.min.js' }))
      .pipe(sourcemaps.write('.'))
      .pipe(browserSync.stream())
  )
}
gulp.task(css)

function libs () {
  return gulp
    .src(npmDist(), { base: './node_modules', allowEmpty: true })
    .pipe(gulp.dest('./src/main/resources/assets/libs'))
}

gulp.task(libs)

function internalJS () {
  return gulp
    .src('./src/main/resources/assets/js-src/modules/**/*.js', { allowEmpty: true })
    .pipe(jsValidate())
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['@babel/env'] }))
    .pipe(sourcemaps.write('.'))
    .pipe(minify({ ext: { min: '.min.js' } }))
    .pipe(gulp.dest('src/main/resources/assets/js/'))
}

function externalJS () {
  return gulp
    .src(['./src/main/resources/assets/js-src/global/**/*.js'], { allowEmpty: true })
    .pipe(jsValidate())
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['@babel/env'] }))
    .pipe(concat('app.min.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./src/main/resources/assets/js'))
}

gulp.task('js', gulp.series(internalJS, externalJS))

gulp.task('default', gulp.series(css, 'js', libs))

gulp.task('start', gulp.series(css, 'js', libs, serve))
