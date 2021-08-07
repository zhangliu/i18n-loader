const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');

// const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
const WAIT_TIME = 20 * 1000;
// const lockLimit = 2000;

const genFile = async (fileType, filePath = '.', jsonData) => {
  const isJson = (fileType || '').toLowerCase() === 'json';
  const i18nFile = isJson ? path.join(filePath, './i18n.json') : path.join(filePath, './i18n.xlsx');
  const fileExist = fs.existsSync(i18nFile);

  // json 文件
  if (isJson) {
    const content = fileExist ? JSON.parse(fs.readFileSync(i18nFile)) : {};
    Object.assign(content, jsonData);
    return fs.writeFileSync(i18nFile, JSON.stringify(content, null, 4));
  }

  // xlsx 文件
  const data = fileExist ?  xlsx.parse(i18nFile)[0].data : [['keys', 'source', 'zh']];
  Object.keys(jsonData).forEach(key => {
    // 已存在相同的key就返回，防止数据重复
    if (data.find(item => item[0] === key)) return;
    data.push([key, jsonData[key], jsonData[key]])
  });
  const content = xlsx.build([{ name: 'sheet1', data }]);
  fs.writeFileSync(i18nFile, content);

  // let hasLock = false;
  // let lockIndex = 0
  // while(lockLimit > lockIndex++) {
  //   hasLock = await lockFile(i18nFile, () => {
  //     const fileExist = fs.existsSync(i18nFile);

  //     // json 文件
  //     if (isJson) {
  //       const content = fileExist ? JSON.parse(fs.readFileSync(i18nFile)) : {};
  //       Object.assign(content, jsonData);
  //       return fs.writeFileSync(i18nFile, JSON.stringify(content, null, 4));
  //     }
  
  //     // xlsx 文件
  //     const data = fileExist ?  xlsx.parse(i18nFile)[0].data : [['keys', 'source', 'zh']];
  //     Object.keys(jsonData).forEach(key => {
  //       // 已存在相同的key就返回，防止数据重复
  //       if (data.find(item => item[0] === key)) return;
  //       data.push([key, jsonData[key], jsonData[key]])
  //     });
  //     const content = xlsx.build([{ name: 'sheet1', data }]);
  //     fs.writeFileSync(i18nFile, content);
  //   });

  //   if (hasLock) return;

  //   await sleep(100);
  // }

  // throw new Error('无法获取文件锁');
}

const lockFile = async (filename, callback) => {
  const lockFilename = `${filename}.lock`;
  return new Promise((resolve) => {
    fs.open(lockFilename, 'wx', (err, fd) => {
      if (err) {
        // if (err.code === 'EEXIST') return resolve(false);
        try {
          const time = new Date(fs.statSync(lockFilename).mtime).getTime();
          if ((Date.now() - time) > WAIT_TIME) fs.unlinkSync(lockFilename);
        } finally {
          return resolve(false);
        }
      }

      try {
        callback();
      } finally {
        resolve(true);
        fs.closeSync(fd);
        try { fs.unlinkSync(lockFilename) } catch(err) {}
      }
    });
  })
}

module.exports = {
  genFile
}