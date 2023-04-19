import {parse, ParseContext} from "../../src";

describe('demo', () => {
  it('1', () => {
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
    // console.log(parseContext);
    console.log(JSON.stringify(parseContext, null, "  "));

    let r = `
{
"key": null,
"value": null,
"children": [
    {
        "key": "name",
        "value": "张飞",
        "children": [],
        "parent": null,
        "comment": "// 姓名\\n",
        "commentMeta": {
            "schemaDescriptor": {},
            "comment": "// 姓名\\n",
            "pureComment": "姓名"
        },
        "type": 0
    },
    {
        "key": "age",
        "value": 123,
        "children": [],
        "parent": null,
        "comment": "// 年龄 \\n",
        "commentMeta": {
            "schemaDescriptor": {},
            "comment": "// 年龄 \\n",
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
`
  })
})

describe('JSON', () => {

  it('JSON.parse()', () => {

    // const jsonParser = new JsonParser("{}");
    // jsonParser.parse()

    let json = `/**
 * 王者英雄
 * @author L&J
 * @sine 2022-3-28 03:03:52
 */
{
  // 姓名 @required
  "name": "张飞",
  // 年龄 
  // @minimum 1
  // @maximum 100
  "age": 123,
  // 经济
  "money": 98700.123,
  // 是否是坦克
  "isTanke": true,
  // 生日 @mock \\@datetime("yyyy-MM-dd HH:mm:ss")
  "birthday": "2022-3-27 23:39:45"
}`;
    const parseContext: ParseContext = parse(json);
    parseContext.parseComment()
    console.log(parseContext);

    expect(true).toBe(true)
  })

  // it('default-import', () => {
  //   const res = BaoJson.parse("{}");
  //   console.log(res);
  // })
})
