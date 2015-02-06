/**
 *  a build template for mx modules
 *  @author yiminghe@gmail.com
 */
var gulp = require('gulp');
var filter = require('gulp-filter');
var kclean = require('gulp-kclean');
var modulex = require('gulp-modulex');
var path = require('path');
var rename = require('gulp-rename');
var packageInfo = require('./package.json');
var cwd = process.cwd();
var src = path.resolve(cwd, 'lib');
var build = path.resolve(cwd, 'build');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var jscs = require('gulp-jscs');
var replace = require('gulp-replace');
var fs = require('fs');

var minifyCSS = require('gulp-minify-css');
var tap = require('gulp-tap');
var concat = require('gulp-concat');

// 读取依赖配置
function readConfig(str) {
	var match =  str.replace(/\n/g, '')
					.replace(/\/\*.+\*\//, '')
					.replace(/"modulex-([^"]+)"/g, '"$1"')
				    .match(/^\{(.+)\}$/);
	if (match && match[1]) {
		return match[1];
	} else {
		return str;
	}
}

// 设置 alias
function getAlias(config) {

	var keys = Object.keys(JSON.parse(config));
	var ret = {};

	keys.forEach(function(k) {

		ret[k.replace(/kg\/([\w\-]+)\/\d+\.\d+\.(\/index)?/, '$1')] = {
			alias: k
		};
		
	});

	return JSON.stringify(ret, null, 4);

}

// 补充前后缀、alias 配置
function supplementConfig(str) {

	var config = formatConfig(str);

	return 'KISSY.config({\n' +
				'"modules": \n' +
				config +
//				config.replace(/\}$/, ',') +
//				getAlias(config).replace(/^\{/, '') + 
				'\n});';

}

// 格式化 config 配置
function formatConfig(str) {

	str = str.replace(/\n/g, '')
			.replace(/:/g, ':{"requires":')
			.replace(/\],/g, ']},');

	str = '{' + str.replace(/"dd"/g, '"kg/dd/0.0.1/index"').replace(/"dd\//g, '"kg/dd/0.0.1/') + '}}';

	return JSON.stringify(JSON.parse(str), null, 4);

}


var SRC_BASE = './build/';

var globOptions = {
    cwd: SRC_BASE,
    base: SRC_BASE
};

gulp.task('lint', function () {
    return gulp.src(['./lib/**/*.js', '!./lib/**/xtpl/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'))
        .pipe(jscs());
});

gulp.task('clean', function () {
    return gulp.src(build, {
        read: false
    }).pipe(clean());
});

gulp.task('tag', function (done) {
    var cp = require('child_process');
    var version = packageInfo.version;
    cp.exec('git tag ' + version + ' | git push origin ' + version + ':' + version + ' | git push origin master:master', done);
});

var wrapper = require('gulp-wrapper');
var date = new Date();
var header = ['//!',
        'Copyright ' + date.getFullYear() + ', ' + packageInfo.name + '@' + packageInfo.version,
        packageInfo.license + ' Licensed,',
        'build time: ' + (date.toGMTString()),
    '\n'].join(' ');
    
gulp.task('build', ['lint'], function (done) {
    var async = require('async');
    var tasks = [];
    var excludes = {
        'dd': [],
        'dd/plugin/constrain': ['dd'],
        'dd/plugin/proxy': ['dd'],
        'dd/plugin/scroll': ['dd']
    };
    Object.keys(excludes).forEach(function (tag) {
        var packages = {};
        packages[tag] = {
            base: path.resolve(src, tag)
        };
        var basename = path.basename(tag);
        var dirname = path.dirname(tag);
        tasks.push(function (done) {
            gulp.src('./lib/' + tag + '.js')
                .pipe(modulex({
                    modulex: {
                        packages: packages
                    },
                    excludeModules: excludes[tag]
                }))
                .pipe(kclean({
                    files: [
                        {
                            src: './lib/' + tag + '-debug.js',
                            outputModule: tag
                        }
                    ]
                }))
                .pipe(replace(/@VERSION@/g, packageInfo.version))
                .pipe(wrapper({
                    header: header
                }))
				.pipe(replace(/modulex\.add\("dd(.)/, function(nul, match) {
					console.log(match);
					if ('"' === match) {
						return 'define("kg/dd/0.0.1/index"';		
					}
					return 'define("kg/dd/0.0.1' + match;		
				 }))
				.pipe(replace(/modulex.config\(([^)]+)\)/g, function(nul, match) {
					return 'KISSY.config({' + match.replace(/"requires"\s*,/, '"modules":') + '});';	  
				 }))
				.pipe(rename(function(path) {
					console.log(path);
					path.basename = path.basename.replace('-debug', '').replace(/dd$/, 'index').replace(/dd-deps$/, 'index-deps');	
				 }))
                .pipe(gulp.dest(path.resolve(build, dirname.replace('dd/plugin', 'plugin'))))
                .pipe(filter(['*.js', '!*-deps.js']))
                .pipe(replace(/@DEBUG@/g, ''))
				.pipe(uglify({
					preserveComments: 'some'
				 }))
                .pipe(rename(function(path) {
					path.extname = '-min.js';	
				 }))
                .pipe(gulp.dest(path.resolve(build, dirname.replace('dd/plugin', 'plugin')))).on('end', done);
        });
    });
    async.parallel(tasks, done);
});

gulp.task('mx', function () {
    var aggregateBower = require('aggregate-bower');
    aggregateBower('bower_components/', 'mx_modules/');
});

gulp.task('auto-d', function () {
    require('auto-deps')(cwd);
});

gulp.task('watch', function () {
    gulp.watch('lib/**/*.xtpl', ['xtpl']);
});

gulp.task('xtpl', function () {
    var gulpXTemplate = require('gulp-xtemplate');
    var XTemplate = require('xtemplate');
    return gulp.src('lib/**/*.xtpl').pipe(gulpXTemplate({
        wrap: false,
        runtime: 'xtemplate/runtime',
        suffix: '.xtpl',
        XTemplate: XTemplate
    })).pipe(gulp.dest('lib'))
});

gulp.task('less', function () {
    var less = require('gulp-less');
    return gulp.src('lib/date-picker/assets/dpl.less').pipe(less({
        paths: [path.join(__dirname, 'lib/date-picker/assets/')]
    }))
        .pipe(rename('dpl-debug.css'))
        .pipe(gulp.dest('lib/date-picker/assets/'))
        .pipe(rename('dpl.css'))
        .pipe(minifyCSS({keepBreaks: true}))
        .pipe(gulp.dest('lib/date-picker/assets/'));
});


// 配置文件
gulp.task('config', ['build'], function () {

	var i = 0;

    return gulp.src(['*-deps.json', '*/*-deps.json', '*/*/*-deps.json'], globOptions)
		.pipe(tap(function(file) {
			if (/\-deps\.json/.test(file.path)) {
				file.contents = new Buffer( (i > 0 ? ',' : '') + readConfig(file.contents.toString().replace(/\/\/.+\n/, '')) );
				++i;
			}
		 }))
		.pipe(concat('deps.js'))
		.pipe(clean())
		.pipe(tap(function(file) {
			file.contents = new Buffer( supplementConfig(file.contents.toString()) );	
		 }))
		.pipe(wrapper({
			header: header
		}))
//		//.pipe(header(banner))
		.pipe(gulp.dest('./build/'))
		.pipe(uglify({
			preserveComments: 'some'
		 }))
		.pipe(rename(function(path){
			 path.extname = '-min.js';
		 }))
        .pipe(gulp.dest('./build/'));

});

gulp.task('default', ['build', 'config']);
