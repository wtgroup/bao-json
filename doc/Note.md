

```
yarn add -D jest ts-jest @types/jest
// 自动生成 jest.config.js
npx ts-jest config:init
```

## 配置相关

* rpt2: options error TS2688: Cannot find type definition file for 'webpack-env'.
  * 忽略. 原因不详.
* rpt2: options error TS6059: File ... is not under 'rootDir'
  * 忽略. `tsconfig.json` 配置 'rootDir' `src`, 单测 `tests` 下也有 ts 文件.