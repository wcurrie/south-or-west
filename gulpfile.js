var gulp = require('gulp');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');

gulp.task('coffee', function() {
      gulp.src('./src/*.coffee')
      .pipe(coffee({bare: true}).on('error', gutil.log))
      .pipe(gulp.dest('./public/'))
});

gulp.task('watch', function() {
    var watcher = gulp.watch('src/*.coffee', ['coffee']);
    watcher.on('change', function(event) {
        console.log('File '+event.path+' was '+event.type+', running tasks...');
    });
});

gulp.task('default', ['coffee']);
