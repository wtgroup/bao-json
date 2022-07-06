import {parse, ParseContext} from "../../src";

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
    console.log(parseContext);

    expect(true).toBe(true)
  })

  // it('default-import', () => {
  //   const res = BaoJson.parse("{}");
  //   console.log(res);
  // })
})
