var gulp = require('gulp');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');

gulp.task('coffee', function() {
      gulp.src('./src/!(mobile)*.coffee')
          .pipe(coffee({bare: true}).on('error', gutil.log))
          .pipe(concat('app.js'))
          .pipe(gulp.dest('./public/'));

      gulp.src('./src/mobile.coffee')
          .pipe(coffee({bare: true}).on('error', gutil.log))
          .pipe(concat('mobile.js'))
          .pipe(gulp.dest('./public/'));
});

gulp.task('watch', function() {
    var watcher = gulp.watch('src/*.coffee', ['coffee']);
    watcher.on('change', function(event) {
        console.log('File '+event.path+' was '+event.type+', running tasks...');
    });
});

gulp.task('default', ['coffee']);
