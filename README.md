# bao-json
[![github](https://img.shields.io/github/stars/wtgroup/bao-json.svg?style=social)](https://github.com/wtgroup/bao-json)
[![npm](https://img.shields.io/npm/v/bao-json)](https://www.npmjs.com/package/bao-json)


我是一款有"灵魂"的 JSON 工具.

**支持注释解析**, 解析结果含有注释信息.
注释是我的灵魂.

## 使用

### ESM

```js
import {parse, ParseContext} from "bao-json";

const json = `
/** 我是一个json */
{
  // 姓名
  "name": "张飞",
  "age": 123, // 年龄 
}`;

const parseContext: ParseContext = parse(json);
// 分离注释, 原始内容 和 纯注释 (去掉注释符号 // 或 /**/). 可选, 需要时调用
parseContext.parseComment()
// 避免下面输出json循环引用报错
parseContext.children[0].parent = null
parseContext.children[1].parent = null
console.log(JSON.stringify(parseContext, null, "  "));
```

输出:
```json
{
"key": null,
"value": null,
"children": [
    {
        "key": "name",
        "value": "张飞",
        "children": [],
        "parent": null,
        "comment": "// 姓名\n",
        "commentMeta": {
            "schemaDescriptor": {},
            "comment": "// 姓名\n",
            "pureComment": "姓名"
        },
        "type": 0
    },
    {
        "key": "age",
        "value": 123,
        "children": [],
        "parent": null,
        "comment": "// 年龄 \n",
        "commentMeta": {
            "schemaDescriptor": {},
            "comment": "// 年龄 \n",
            "pureComment": "年龄"
        },
        "type": 1
    }
],
"parent": null,
"comment": "/** 我是一个json */",
"commentMeta": {
    "schemaDescriptor": {},
    "comment": "/** 我是一个json */",
    "pureComment": "我是一个json "
},
"type": 4
}
```


### Node

```js
const BaoJson = require('bao-json');
BaoJson.parse('{"name": "张飞", "age": 18}')
```