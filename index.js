const loaderUtils = require('loader-utils');
const path = require('path');
const fs = require('fs');
const converter = require('./src/convert');

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
  options.genKeyFunc = Array.isArray(options.genKeyFunc)
    ? new Function(option.genKeyFunc)
    : (option.genKeyFunc || ((_, hashKey) => `k${hashKey}`));
  cache[cacheKey] = converter.handle(source, this.resourcePath, options);

  // console.log(cache[cacheKey], 'xxxxxxxxxxxxxxxxxxxxxxxx');

  return cache[cacheKey];
}

const log = (resourcePath) => {
  const file = path.basename(resourcePath);
  const dirname = path.basename(path.dirname(resourcePath));
  console.log(`will i18nify file: ${dirname}/${file}`);
}