# bao-json
我是一款有"灵魂"的 JSON 工具.


## 使用

### ESM

```js
import {parse, ParseContext} from "bao-json";

const json = '{"name": "张飞", "age": 18}';
const parseContext: ParseContext = parse(json);
console.log(parseContext);
```

### Node

```js
const BaoJson = require('bao-json');
BaoJson.parse('{"name": "张飞", "age": 18}')
```