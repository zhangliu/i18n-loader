# i18n loader
用于替代国际化 babel 插件：https://bytedance.feishu.cn/docs/doccn3YLD0BEzubZWMxUDXSAgah。

# 用法：
```javascript
// webpack 配置
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: [{
          loader: 'i18n-loader', // 使用 i18n-loader，注意放到所有 loader 的最前面，不然处理的代码会有高级语法
          options: {
            excludes: ['./src/pages'], // 哪些文件不需要国际化处理
            includes: ['./src/pages'],
            genKeyFunc: 'window.$i18n'
          }
        }, "other-loader"],
      },
    ],
  },
}

```