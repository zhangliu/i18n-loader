const t = require('@babel/types');
const { isAddNode } = require('./nodeHelper');

const START_INDEX = 1;
const EMPTY = '';

const getParamInfo = (tlNode) => {
  const { quasis = [], expressions = [] } = tlNode;
  return {
    paramStr: getParamStr(quasis),
    paramNode: getParamNode(expressions),
  }
}

const getParamStr = (quasis) => {
  let result = '';
  let index = START_INDEX;
  quasis.forEach(q => {
    if (q === quasis[quasis.length - 1]) return result += q.value.cooked;
    return result += `${q.value.cooked}{p${index++}}`;
  })

  return result;
}

const getParamNode = (expressions) => {
  let index = START_INDEX;
  const props = [];
  expressions.forEach(e => {
    props.push(t.ObjectProperty(t.StringLiteral(`p${index}`), e));
    index++;
  });

  return t.ObjectExpression(props);
}

const getTemplateNode = (node, isRoot = true) => {
  if (!node) return {};
  if (isAddNode(node)) {
    const lResult = getTemplateNode(node.left, false);
    const rResult = getTemplateNode(node.right, false);
    let quasis = (lResult.quasis || []).concat(rResult.quasis || []);
    if (isRoot) { // 根据模板字符串规则，进行一些修正
      const valueQuasis = quasis.filter(q => q.value.cooked !== EMPTY);
      valueQuasis.forEach(vq => {
        if (vq === valueQuasis[valueQuasis.length - 1]) return; // 最后一个不用处理
        const index = quasis.indexOf(vq);
        if (!quasis[index + 1]) return;
        if (quasis[index + 1].value.cooked !== EMPTY) {
          quasis[index].value.cooked += quasis[index + 1].value.cooked;
        }
        quasis[index + 1].value.shouldDel = true;
      });
      quasis = quasis.filter(q => !q.value.shouldDel);
    }
    return {
      quasis,
      expressions: [...(lResult.expressions || []), ...(rResult.expressions || [])],
    }
  }
  // 转换为字符串模板的 quasis
  if (node.type === 'StringLiteral') {
    if (node.value === EMPTY) return { quasis: [] };
    return { quasis: [{ value: { cooked: node.value } }] };
  }
  return { quasis: [{ value: { cooked: EMPTY } }], expressions: [node] };
}

module.exports = {
  getParamInfo,
  getTemplateNode,
}