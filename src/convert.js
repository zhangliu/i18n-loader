const parser = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('babel-traverse').default;
const stringHash = require('string-hash');
const t = require('@babel/types');
const package = require('../package.json');
const { getParamInfo, getTemplateNode } = require('./utils/tlHelper');
const { genFile } = require('./utils/i18nFile');
const { isAddNode } = require('./utils/nodeHelper');

const allLangs = {};
const hasChinese = str => /[\u4E00-\u9FFF]+/g.test((str || '').toString());
let uploadTimer = null;

module.exports.handle = (source, file, { genKeyFunc, ignoreFuncs, i18nFunc, fileType, filePath }) => {
  const langs = {};
  const ast = parser.parse(source, {
    allowImportExportEverywhere: true,
    plugins: ['classProperties', 'decorators-legacy']
  });

  traverse(ast, {
    StringLiteral(path) {
      const paramStr = path.node.value;
      if (!hasChinese(paramStr)) return;

      const funcName = getFuncName(path);
      if (ignoreFuncs.includes(funcName)) return;
      if (funcName === i18nFunc) return;

      if (isAddNode(path.parent)) {
        const { tlNode, rootPath } = handleAddOperator(path);
        const result = getParamInfo(tlNode);
        const hashKey = genKeyFunc(result.paramStr, stringHash(result.paramStr).toString());
        langs[hashKey] = result.paramStr;
        replaceNode(rootPath, i18nFunc, { key: hashKey, paramNode: result.paramNode, paramStr: result.paramStr });
        return;
      }

      const hashKey = genKeyFunc(paramStr, stringHash(paramStr).toString());
      langs[hashKey] = paramStr;
      replaceNode(path, i18nFunc, { key: hashKey, paramNode: t.ObjectExpression([]), paramStr });
    },

    TemplateLiteral(path) {
      const { paramStr, paramNode } = getParamInfo(path.node);
      if (!hasChinese(paramStr)) return;
      
      const funcName = getFuncName(path);
      if (ignoreFuncs.includes(funcName)) return;
      if (funcName === i18nFunc) return;

      const hashKey = genKeyFunc(paramStr, stringHash(paramStr).toString());

      langs[hashKey] = paramStr;
      replaceNode(path, i18nFunc, { key: hashKey, paramNode, paramStr });
    },
  });

  if (Object.keys(langs).length <= 0) return source;
  
  uploadStarling(allLangs);
  Object.assign(allLangs, langs);
  genFile(fileType, filePath, allLangs).catch(error => {
    console.error(`[${package.name}] 文件 ${file} 国际化失败！${error.message || ''}`);
  });
  const newSource = generate(ast);
  return newSource.code;
};

function getFuncName(path, dept = 2) {
  let index = 0;
  let cPath = path;

  while(true) {
    cPath = cPath.parentPath || {}
    if (cPath.type === 'CallExpression') break;
    if (index++ > dept) return
  }

  let callee = cPath.node.callee || {};
  while(callee.type === 'CallExpression') {
    if (!callee.callee) break;
    callee = callee.callee
  }

  if (callee.type === 'Identifier') return callee.name;

  if (callee.type === 'MemberExpression') {
    const {object = {}, property = {}} = callee;
    return `${object.name}.${property.name}`;
  }

  throw new Error(`unHandle callee type: ${callee.type}`);
}

const handleAddOperator = (path) => {
  let rootPath = path.parentPath;
  while(true) {
    if (!isAddNode(rootPath.parent)) break;
    rootPath = rootPath.parentPath;
  }

  const tlNode = getTemplateNode(rootPath.node);
  return { tlNode, rootPath };
}

const replaceNode = (path, i18nFunc, { key, paramNode, paramStr }) => {
  if (!path.parentKey) return;

  let node = t.callExpression(
    t.identifier(i18nFunc),
    [t.StringLiteral(key), paramNode, t.StringLiteral(paramStr)]
  );

  if (Array.isArray(path.parent[path.parentKey])) {
    path.parent[path.parentKey][path.key] = node;
    return;
  }

  // 处理中文key: { '1小时': 'one hour' };
  if (path.parent.type === 'ObjectProperty' && path.parentKey === 'key') {
    path.parent[path.parentKey] = t.arrayExpression([node]);
    return;
  }

  path.parent[path.parentKey] = node;
}

const uploadStarling = (langs) => {
  clearTimeout(uploadTimer);
  return new Promise(r => {
    uploadTimer = setTimeout(() => {
      // console.log('i18n convert over!:', langs, '***********************');
      console.log('i18n convert over!');
      r();
    }, 3000);
  })
}