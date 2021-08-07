const loaderUtils = require('loader-utils');
const path = require('path');
const fs = require('fs');
const converter = require('./src/convert');

const defaultIgnoreFuncs = ['console.log', 'console.warn', 'console.error'];
const defaultI18nFunc = 'window.$i18n';
const cache = {}

module.exports = function(source) {
  const options = loaderUtils.getOptions(this) || {};
  const regs = options.tests || [/.*/];
  const isMatch = regs.find(reg => reg.test(this.resourcePath));
  if (!isMatch) return source;

  const mTime = fs.statSync(this.resourcePath).mtime;
  const cacheKey = `${this.resourcePath}@${mTime}`;
  if (cache[cacheKey]) return cache[cacheKey];

  log(this.resourcePath);
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

const log = (resourcePath) => {
  const file = path.basename(resourcePath);
  const dirname = path.basename(path.dirname(resourcePath));
  console.log(`will i18nify file: ${dirname}/${file}`);
}