// 1. 这里使用到的安装包均需要安装成开发依赖
// 例如下面用到需要如下安装
// yarn add -D rollup rollup-plugin-babel @rollup/plugin-typescript @rollup/plugin-node-resolve

// 导出defineConfig方法可以让编辑器（VSCode）智能提示所有的rollup的配置项，很方便
import { defineConfig } from 'rollup';
// 这里是babel的插件，用来处理es的转换，当然会用一个.babelrc配置文件，下面也会简单列出来
import babel from 'rollup-plugin-babel';
// rollup处理typescript的插件
import typescript from '@rollup/plugin-typescript';
// resolve将我们编写的源码与依赖的第三方库进行在之前的文章里面也有提到但是这里使用的@rollup/plugin-node-resolve
import resolve from '@rollup/plugin-node-resolve';
// 解决rollup.js无法识别CommonJS模块，这里使用的是@rollup/plugin-commonjs并不是之前提到的rollup-plugin-commonjs
import commonjs from '@rollup/plugin-commonjs';
// 引入package.json
import pkg from './package.json';

// import commonjs from 'rollup-plugin-commonjs';

// 拿到package.json的name属性来动态设置打包名称
const libName = pkg.name;
export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      file: `dist/${libName}.cjs.js`,
      // commonjs格式
      format: 'cjs',
    },
    {
      file: `dist/${libName}.es.js`,
      // es module
      format: 'es',
    },
    {
      file: `dist/${libName}.umd.js`,
      // 通用格式可以用于node和browser等多个场景
      format: 'umd',
      // 外部引入的模块需要显式告知使用的三方模块的命名，结合下面的external使用
      // globals: {
      //   '@antv/g6': 'G6',
      // },
      // 注意如果是umd格式的bundle的话name属性是必须的，这时可以在script标签引入后window下会挂载该属性的变量来使用你的类库方法
      name: libName,
    },
  ],
  // 解释同globals配置，这个配置的意思是我简单处理把外部依赖不打包进bundle中，而是前置引入或者作为依赖安装使用
  // external: ['@antv/g6'],
  plugins: [
    babel(),
    typescript({
      sourceMap: false,
    }),
    resolve(),
  ],
});

// export default {
//   input: 'src/index.ts',
//   output: {
//     file: 'index.js',
//     format: 'cjs'
//   },
//   // 支持.vue文件的打包
//   plugins: [
//     commonjs(),
//     // vue(),
//   ]
// };