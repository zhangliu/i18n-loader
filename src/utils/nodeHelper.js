const isAddNode = node => (node.type === 'BinaryExpression') && (node.operator === '+');

module.exports = {
  isAddNode
}