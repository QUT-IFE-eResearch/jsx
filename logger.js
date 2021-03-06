var path = require('path');

var levels = {debug:0, info:1, warn:2, error:3, fatal:4};
var levelsStr = Object.keys(levels);
var levelLimit = 0;
var errorLimit = 3;
var useRelativePath = true;

function getLevel(level) {
  var levelObj = {};
  if (typeof level === 'string') {
    levelObj.s = level;
    levelObj.n = levels[level];
    if (typeof levelObj.n === 'undefined') throw new Error('Invalid log level.');
  } else if (typeof level === 'number'){
    levelObj.n = level;
    levelObj.s = levelsStr[level];
    if (typeof levelObj.s === 'undefined') throw new Error('Invalid log level.');
  } else {
    throw new Error('Log level must be string or number.');
  }
  return levelObj;
}

function log(level, data) {
  var l = getLevel(level);
  if (l.n >= levelLimit) {
    var out = console.log;
    if (l.n >= errorLimit) out = console.error;
    var msg = '[' + (new Date()).toJSON() + '] [' + [l.s.toUpperCase()] + '] [' + this.filename + '] - ' + data;
    var args = Array.prototype.slice.call(arguments, 2);
    args.unshift(msg);
    out.apply(console, args);
    if ((typeof data === 'object') && (data!==null)) {
      if (data instanceof Error) console.log(data.stack);
      else console.log(data);
      console.log('');
    }
  }
};

function Logger(filename) {
  this.filename = filename;
}

/** Sets the current log level. Any log request specified at lower level will not be displayed. */
Logger.prototype.setLevel = function(level) {
  levelLimit = getLevel(level).n;
  return this;
};

/** Gets the current log level. */
Logger.prototype.getLevel = function(cb) {
  cb(levelLimit, levelsStr[levelLimit]);
  return this;
};

/** 
 * Sets the current error level. Error level specifies a level that is considered as an error or worse. 
 * A log request with specified level equal to or more than the error level will be sent to STDERR 
 */
Logger.prototype.setErrorThreshold = function(level) {
  errorLimit = getLevel(level).n;
  return this;
};

/** Gets the current error level. */
Logger.prototype.getErrorThreshold = function(cb) {
  cb(errorLimit, levelsStr[errorLimit]);
  return this;
};


/** @param value Set to true to make the logger print a shorter path relative to the main app. Default is true. */
Logger.prototype.useRelativePath = function(value) {
  useRelativePath = value;
  return this;
};

Logger.prototype.log = log;
levelsStr.forEach( function(level) {
  Logger.prototype[level] = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(level);
    log.apply(this, args);
  };
});

var factory = module.exports = function(cModule) {
  var filename = '';
  if (cModule) {
    if (typeof cModule == 'string') filename = cModule;
    else if (cModule.filename) filename = cModule.filename;
  }
  if (useRelativePath) filename = path.join(path.relative(process.cwd(), path.dirname(filename)), path.basename(filename));
  return new Logger(filename);
}

Object.defineProperties(factory, {
  level : {
    get: function() { return levelLimit; },
    set: function(level) { levelLimit = getLevel(level).n; }
    },
  errorThreshold : {
    get: function() { return errorLimit; },
    set: function(level) { errorLimit = getLevel(level).n; }
    },
});
