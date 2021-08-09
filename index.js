const loaderUtils = require('loader-utils');
const path = require('path');
const fs = require('fs');
const converter = require('./src/convert');

const defaultIgnoreFuncs = ['console.log', 'console.warn', 'console.error'];
const defaultI18nFunc = 'window.$i18n';
const cache = {};

module.exports = function(source) {
  const options = loaderUtils.getOptions(this) || {};
  if (!match(this.resourcePath, options.includes, options.excludes)) return source;

  const mTime = fs.statSync(this.resourcePath).mtime;
  const cacheKey = `${this.resourcePath}@${mTime}`;
  if (cache[cacheKey]) return cache[cacheKey];

  // log(this.resourcePath);
  const genKeyFunc = Array.isArray(options.genKeyFunc)
    ? new Function(options.genKeyFunc)
    : (options.genKeyFunc || ((_, hashKey) => `k${hashKey}`));
  cache[cacheKey] = converter.handle(source, this.resourcePath, {
    ignoreFuncs: defaultIgnoreFuncs,
    i18nFunc: defaultI18nFunc,
    ...options,
    genKeyFunc,
  });

  return cache[cacheKey];
}

const match = (file, includes = [], excludes = []) => {
  if (getAbsPath(excludes).find(i => file.startsWith(i))) return false;
  if (!includes || includes.length <= 0) return true;

  return getAbsPath(includes).find(i => file.startsWith(i));
}

function getAbsPath(files) {
  return (files || []).map(file => {
    const rootPath = process.cwd();
    const isAbs = file.startsWith(rootPath);
    return isAbs ? file : path.join(rootPath, file);
  })
}

const log = (resourcePath) => {
  const file = path.basename(resourcePath);
  const dirname = path.basename(path.dirname(resourcePath));
  console.log(`will i18nify file: ${dirname}/${file}`);
}