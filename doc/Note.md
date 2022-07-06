

```
yarn add -D jest ts-jest @types/jest
// 自动生成 jest.config.js
npx ts-jest config:init
```

## 配置相关

* rpt2: options error TS2688: Cannot find type definition file for 'webpack-env'.
  * 删除 `tsconfig.json.compilerOptions.types.webpack-env`
* rpt2: options error TS6059: File ... is not under 'rootDir'
  * 忽略. `tsconfig.json` 配置 'rootDir' `src`, 单测 `tests` 下也有 ts 文件.
* 打包的js, 引入后, 报 'Module parse failed: Unexpected token (1:171)
  You may need an appropriate loader to handle this file type,'
  * 可能是打包成 `esnext` , 用户项目, 则需要更多的配置, 比如 babel , 可能.
  * `tsconfig.json` `"target": "ES5"` . 兼容性更好了. 用户项目直接使用.