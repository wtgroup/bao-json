import {StringNN} from "./type";

function char(str: string) {
  if (str == null) {
    return -1;
  }
  if (str.length > 1) {
    throw new Error("'str' must len 1");
  }
  return str.charCodeAt(0);
}

function str(i: number) {
  return String.fromCharCode(i);
}

function isIntNumber(i: number) {
  return ~~i === i;
}

class JsonToken {
  static ERROR = new JsonToken("error");
  static NULL = new JsonToken("null");
  static UNDEFINED = new JsonToken("undefined");
  static LPAREN = new JsonToken("(");
  static RPAREN = new JsonToken(")");
  static LBRACE = new JsonToken("{");
  static RBRACE = new JsonToken("}");
  static LBRACKET = new JsonToken("[");
  static RBRACKET = new JsonToken("]");
  static COMMA = new JsonToken(",");
  static COLON = new JsonToken(":");
  static SEMI = new JsonToken(";");
  static DOT = new JsonToken(".");
  static LITERAL_STRING = new JsonToken("string")
  static LITERAL_NUMBER = new JsonToken("number")
  static TRUE = new JsonToken("true")
  static FALSE = new JsonToken("false")
  static IDENTIFIER = new JsonToken("identifier")
  static EOF = new JsonToken("eof")

  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

enum ItemType {
  STRING,
  INT_NUMBER,
  FLOAT_NUMBER,
  BOOL,
  OBJECT,
  ARRAY,
}

class JsonLexer {
  static EOI = 0x1A
  text = '';
  bp;
  // string 长度
  sp = 0;
  np = 0;
  pos = 0;
  eofPos = 0;
  hasSpecial = false;
  len;
  ch = -1;
  _token: JsonToken | undefined;
  // whitespace LF count
  wsLfCnt = 0;
  commentBuff = '';

  constructor(input: string) {
    this.text = input;
    this.len = input.length;
    this.bp = -1;

    this.next();
    if (this.ch == 65279) { // utf-8 bom
      this.next();
    }
  }

  token() {
    return this._token;
  }

  tokenName() {
    return this._token?.name;
  }

  skipWhitespace() {
    this.wsLfCnt = 0; // 重置
    for (; ;) {
      if (this.ch < char('/')) { // 原 '<='
        if (this.isWhitespace(this.ch)) {
          if (this.isLf(this.ch)) {
            this.wsLfCnt++;
          }
          this.next();
          continue;
        } /*else if (this.ch == char('/')) {
          this.skipComment();
          continue;
        }*/ else {
          break;
        }
      } else {
        break;
      }
    }
  }

  /**
   * 上一个char是'/'才会调用此方法.
   */
  skipComment() {
    this.next();
    if (this.ch == char('/')) { // '//' 开始的单行注释
      for (; ;) {
        this.next();
        if (this.ch == char('\n')) { // '//' 单行注释, 遇到换行即停
          this.next();
          return;
        } else if (this.ch == JsonLexer.EOI) {
          return;
        }
      }
    } else if (this.ch == char('*')) { // '/*' 开始的注释块
      this.next();

      for (; this.ch != JsonLexer.EOI;) {
        if (this.ch == char('*')) {
          this.next();
          if (this.ch == char('/')) { // 遇到 '*/' 结束注释块
            this.next();
            return;
          } else {
            continue;
          }
        }
        this.next();
      }
    } else {
      throw new Error("invalid comment");
    }
  }

  isWhitespace(ch: number) {
    return ch == char(' ') ||
        ch == char('\r') ||
        ch == char('\n') ||
        ch == char('\t') ||
        ch == char('\f') ||
        ch == char('\b');
  }

  isLf(ch: number) {
    return ch == char('\n');
  }

  isIdentifier(ch: number) {
    return (ch >= char('A') && ch <= char('Z'))
        || (ch >= char('a') && ch <= char('z'))
        || (ch >= char('0') && this.ch <= char('9'))
        || (ch == char('_'));
  }

  nextToken() {
    this.sp = 0;

    for (; ;) {
      this.pos = this.bp;

      if (this.ch == char('/')) {
        // this.skipComment();
        this.commentBuff = this.scanComment();
        continue;
      }

      if (this.ch == char('"')) {
        this.scanString();
        return;
      }

      if (this.ch == char(',')) {
        this.next();
        this._token = JsonToken.COMMA;
        return;
      }

      if (this.ch >= char('0') && this.ch <= char('9')) {
        this.scanNumber();
        return;
      }

      if (this.ch == char('-')) {
        this.scanNumber();
        return;
      }

      switch (this.ch) {
        case char('\''):
          // if (!isEnabled(Feature.AllowSingleQuotes)) {
          //   throw new JSONException("Feature.AllowSingleQuotes is false");
          // }
          // this.scanStringSingleQuote();
          this.scanSymbol("'");
          return;
        case char(' '):
        case char('\t'):
        case char('\b'):
        case char('\f'):
        case char('\n'):
        case char('\r'):
          this.next();
          break;
        case char('t'): // true
          this.scanTrue();
          return;
        case char('f'): // false
          this.scanFalse();
          return;
        case char('n'): // new,null
          // this.scanNullOrNew();
          this.scanNull();
          return;
        case char('T'):
        case char('N'): // NULL
        case char('S'):
        case char('u'): // undefined
          this.scanIdent();
          return;
        case char('('):
          this.next();
          this._token = JsonToken.LPAREN;
          return;
        case char(')'):
          this.next();
          this._token = JsonToken.RPAREN;
          return;
        case char('['):
          this.next();
          this._token = JsonToken.LBRACKET;
          return;
        case char(']'):
          this.next();
          this._token = JsonToken.RBRACKET;
          return;
        case char('{'):
          this.next();
          this._token = JsonToken.LBRACE;
          return;
        case char('}'):
          this.next();
          this._token = JsonToken.RBRACE;
          return;
        case char(':'):
          this.next();
          this._token = JsonToken.COLON;
          return;
        case char(';'):
          this.next();
          this._token = JsonToken.SEMI;
          return;
        case char('.'):
          this.next();
          this._token = JsonToken.DOT;
          return;
        case char('+'):
          this.next();
          this.scanNumber();
          return;
          // case char('x'):
          //   this.scanHex();
          //   return;
        default:
          if (this.isEOF()) { // JLS
            if (this._token == JsonToken.EOF) {
              throw new Error("EOF error");
            }

            this._token = JsonToken.EOF;
            this.eofPos = this.pos = this.bp;
          } else {
            if (this.ch <= 31 || this.ch == 127) {
              this.next();
              break;
            }

            this.lexError("illegal.char", str(this.ch));
            this.next();
          }

          return;
      }
    }

  }

  nextTokenExpect(expect: JsonToken) {
    return this.nextToken(); // 暂
  }

  getCurrent() {
    return this.ch;
  }

  next(): number {
    const index = ++this.bp;
    return this.ch = (index >= this.len ? //
        JsonLexer.EOI //
        : this.text.charCodeAt(index));
  }

  /**
   * scan 符号
   * @param quote 包裹的引号(双|单), 可null, 表示没有引号包裹
   */
  scanSymbol(quote: string) {
    this.np = this.bp;
    const unQuoted = !quote;
    this.sp = unQuoted ? 1 : 0; // unQuoted, 要包含进当前字符

    let chLocal: number;

    for (; ;) {
      chLocal = this.next();

      if (unQuoted) { // 没有引号开始, 遇到非'标识符'结束
        if (!this.isIdentifier(chLocal)) {
          break;
        }
      } else { // 有引号开始, 遇到同样引号结束
        if (chLocal == char(quote)) {
          break;
        }
      }

      if (chLocal == JsonLexer.EOI) {
        throw new Error("unclosed.str");
      }

      // 暂不考虑 '\' 转义

      this.sp++;
    }

    this._token = JsonToken.LITERAL_STRING;

    let value;
    let offset;
    if (this.np == -1) {
      offset = 0;
    } else {
      offset = unQuoted ? this.np : this.np + 1; // quoted, 略过 quote
    }

    value = this.text.substr(offset, this.sp);

    this.sp = 0;
    if (!unQuoted) this.next(); // 略过 quote

    return value;
  }

  scanSymbolUnQuoted() {
    return this.scanSymbol("");
  }

  scanNumber() {
    this.np = this.bp;

    if (this.ch == char('-')) {
      this.sp++;
      this.next();
    }

    for (; ;) {
      if (this.ch >= char('0') && this.ch <= char('9')) {
        this.sp++;
      } else {
        break;
      }
      this.next();
    }

    let isDouble = false;

    if (this.ch == char('.')) {
      this.sp++;
      this.next();
      isDouble = true;

      for (; ;) {
        if (this.ch >= char('0') && this.ch <= char('9')) {
          this.sp++;
        } else {
          break;
        }
        this.next();
      }
    }

    if (this.sp > 65535) {
      throw new Error("scanNumber overflow");
    }

    if (this.ch == char('L')) {
      this.sp++;
      this.next();
    } else if (this.ch == char('S')) {
      this.sp++;
      this.next();
    } else if (this.ch == char('B')) {
      this.sp++;
      this.next();
    } else if (this.ch == char('F')) {
      this.sp++;
      this.next();
      isDouble = true;
    } else if (this.ch == char('D')) {
      this.sp++;
      this.next();
      isDouble = true;
    } else if (this.ch == char('e') || this.ch == char('E')) {
      this.sp++;
      this.next();

      if (this.ch == char('+') || this.ch == char('-')) {
        this.sp++;
        this.next();
      }

      for (; ;) {
        if (this.ch >= char('0') && this.ch <= char('9')) {
          this.sp++;
        } else {
          break;
        }
        this.next();
      }

      if (this.ch == char('D') || this.ch == char('F')) {
        this.sp++;
        this.next();
      }

      isDouble = true;
    }

    // if (isDouble) {
    //   token = JSONToken.LITERAL_FLOAT;
    // } else {
    //   token = JSONToken.LITERAL_INT;
    // }
    this._token = JsonToken.LITERAL_NUMBER;
  }

  scanTrue() {
    if (this.ch != char('t')) {
      throw new Error("error parse true");
    }
    this.next();

    if (this.ch != char('r')) {
      throw new Error("error parse true");
    }
    this.next();

    if (this.ch != char('u')) {
      throw new Error("error parse true");
    }
    this.next();

    if (this.ch != char('e')) {
      throw new Error("error parse true");
    }
    this.next();

    if (this.ch == char(' ') ||
        this.ch == char(',') ||
        this.ch == char('}') ||
        this.ch == char(']') ||
        this.ch == char('\n') ||
        this.ch == char('\r') ||
        this.ch == char('\t') ||
        this.ch == JsonLexer.EOI ||
        this.ch == char('\f') ||
        this.ch == char('\b') ||
        this.ch == char(':') ||
        this.ch == char('/')) {
      this._token = JsonToken.TRUE;
    } else {
      throw new Error("scan true error");
    }
  }

  scanFalse() {
    if (this.ch != char('f')) {
      throw new Error("error parse false");
    }
    this.next();

    if (this.ch != char('a')) {
      throw new Error("error parse false");
    }
    this.next();

    if (this.ch != char('l')) {
      throw new Error("error parse false");
    }
    this.next();

    if (this.ch != char('s')) {
      throw new Error("error parse false");
    }
    this.next();

    if (this.ch != char('e')) {
      throw new Error("error parse false");
    }
    this.next();

    if (this.ch == char(' ') ||
        this.ch == char(',') ||
        this.ch == char('}') ||
        this.ch == char(']') ||
        this.ch == char('\n') ||
        this.ch == char('\r') ||
        this.ch == char('\t') ||
        this.ch == JsonLexer.EOI ||
        this.ch == char('\f') ||
        this.ch == char('\b') ||
        this.ch == char(':') ||
        this.ch == char('/')) {
      this._token = JsonToken.FALSE;
    } else {
      throw new Error("scan false error");
    }
  }

  scanNull() {
    if (this.ch != char('n')) {
      throw new Error("error parse null");
    }
    this.next();

    if (this.ch != char('u')) {
      throw new Error("error parse null");
    }
    this.next();

    if (this.ch != char('l')) {
      throw new Error("error parse null");
    }
    this.next();

    if (this.ch != char('l')) {
      throw new Error("error parse null");
    }
    this.next();

    if (this.isWhitespace(this.ch)
        || this.ch == char(',')
        || this.ch == char('}')
        || this.ch == char(']')
        || this.ch == JsonLexer.EOI
    ) {
      this._token = JsonToken.NULL;
    } else {
      throw new Error("scan null error");
    }
    return;
  }

  scanIdent() {
    this.np = this.bp - 1;
    // hasSpecial = false;

    for (; ;) {
      this.sp++;

      this.next();
      if (!this.isIdentifier(this.ch)) {
        break;
      }
    }

    const ident = this.stringValue();

    if ("null" == ident.toLowerCase()) {
      this._token = JsonToken.NULL;
    } /*else if ("new" == ident.toLowerCase()) {
      this._token = JsonToken.NEW;
    }*/ else if ("true" == ident.toLowerCase()) {
      this._token = JsonToken.TRUE;
    } else if ("false" == ident.toLowerCase()) {
      this._token = JsonToken.FALSE;
    } else if ("undefined" == ident.toLowerCase()) {
      this._token = JsonToken.UNDEFINED;
    } /*else if ("Set" == ident.toLowerCase()) {
      this._token = JsonToken.SET;
    } else if ("TreeSet" == ident.toLowerCase()) {
      this._token = JsonToken.TREE_SET;
    }*/ else {
      this._token = JsonToken.IDENTIFIER;
    }
    return;
  }

  /**
   *
   */
  scanString() {
    this.np = this.bp;
    this.hasSpecial = false;
    let ch;
    for (; ;) {
      ch = this.next();

      if (ch == char('"')) {
        break;
      }

      if (ch == JsonLexer.EOI) {
        if (!this.isEOF()) {
          // putChar((char) EOI);
          continue;
        }
        throw new Error("unclosed string : " + str(ch));
      }

      // 暂不考虑转义

      if (!this.hasSpecial) {
        this.sp++;
        continue;
      } // else 不计入长度

    }

    this._token = JsonToken.LITERAL_STRING;
    this.ch = this.next();
  }

  /**
   * 上一个char是'/'才会调用此方法.
   * 注释内容原样收集, 含标识符们.
   *
   * 1. 单行.
   * 2. 多行.
   * 3. 注释块.
   */
  scanComment(isTail = false) {
    if (this.ch != char('/')) {
      return '';
    }

    let singleLine = false;
    let cmmntBuf = str(this.ch);
    this.next();
    cmmntBuf += str(this.ch); // cmmntBuf == '//' | '/*'
    if (this.ch == char('/')) { // '//' 开始的单行注释
      this.next();
      for (; this.ch != JsonLexer.EOI;) {
        cmmntBuf += str(this.ch);
        if (this.ch == char('\n')) {
          if (isTail) {
            // '//...' 单行
            this.next();
            singleLine = true;
            break;
          }
          // 多行注释. 下一行还是 '//...' 吗, 是, 则继续 scan
          this.skipWhitespace(); // 忽略注释行首的空白
          if (this.ch == char('/')) {
            cmmntBuf += str(this.ch);
            this.next();
            cmmntBuf += str(this.ch);
            if (this.ch != char('/')) {
              throw new Error("invalid comment");
            }
          } else {
            break;
          }
        } /*else if (this.ch == JsonLexer.EOI) {
          break;
        }*/

        this.next();
      }
    } else if (this.ch == char('*')) { // '/*' 开始的注释块
      this.next();

      for (; this.ch != JsonLexer.EOI;) {
        cmmntBuf += str(this.ch);
        if (this.ch == char('*')) {
          this.next();
          if (this.ch == char('/')) { // 遇到 '*/' 结束注释块
            cmmntBuf += str(this.ch); // '/' 计入
            this.next();
            break;
          } else {
            continue;
          }
        }
        this.next();
      }
    } else {
      throw new Error("invalid comment");
    }

    // 多个注释区域?
    if (!singleLine) {
      this.skipWhitespace();
      if (this.ch == char('/')) {
        cmmntBuf += '\n'.repeat(this.wsLfCnt) + this.scanComment();
      }
    }

    // if (this.wsLfCnt > 0) {
    //   // 前面空白中有换行, 则当前注释归属其后面的 context
    // } else {
    //   // 行尾的, 但前面 context 是 object|array, 也是归属下一个 context
    // }

    this.skipWhitespace();

    return cmmntBuf;
  }

  numberValue() {
    const chLocal = this.text.charAt(this.np + this.sp - 1);

    let sp = this.sp;
    if (chLocal == 'L' || chLocal == 'S' || chLocal == 'B' || chLocal == 'F' || chLocal == 'D') {
      sp--;
    }

    const s = this.text.substr(this.np, sp);

    return Number(s); // 暂
  }

  stringValue() {
    return this.text.substr(this.np + 1, this.sp);
  }

  isEOF() {
    return this.bp == this.len || (this.ch == JsonLexer.EOI && this.bp + 1 >= this.len);
  }

  info() {
    let buf = '';

    let line = 1;
    let column = 1;
    for (let i = 0; i < this.bp; ++i, column++) {
      const ch = this.text.charAt(i);
      if (ch == '\n') {
        column = 1;
        line++;
      }
    }

    buf += "pos " + this.bp +
        ", line " + line
        + ", column " + column;

    if (this.text.length < 65535) {
      buf += this.text;
    } else {
      buf += this.text.substring(0, 65535);
    }

    return buf;
  }

  resetStringPosition() {
    this.sp = 0;
  }

  resetCommentBuff() {
    const t = this.commentBuff;
    this.commentBuff = '';
    return t;
  }

  lexError(key: any, ...args: any) {
    this._token = JsonToken.ERROR;
  }

  isBlankInput() {
    return this.text?.trim().length == 0;
  }
}

class JsonParser {
  input;
  lexer: JsonLexer;
  objectKeyLevel = 0;
  context: ParseContext | null = null;
  contextArray: ParseContext[] = [];

  constructor(input: string) {
    this.lexer = new JsonLexer(input);
    this.input = input;

    const ch = this.lexer.getCurrent();
    if (ch == char('{')) {
      this.lexer.next();
      this.lexer._token = JsonToken.LBRACE;
    } else if (ch == char('[')) {
      this.lexer.next();
      this.lexer._token = JsonToken.LBRACKET;
    } else {
      this.lexer.nextToken(); // prime the pump
    }
  }

  /**
   *
   * com.alibaba.fastjson.parser.DefaultJSONParser#parseObject(java.util.Map, java.lang.Object) (v1.2.73) 180行
   * @param ctx
   * @param fieldName
   */
  parseObject(ctx: JsonObjectContext, fieldName: any) {
    if (this.lexer.token() == JsonToken.NULL) {
      this.lexer.nextToken();
      return null;
    }

    let context = this.context = ctx; // 当前 context  我这里 context 和 结果在一起, 当前就是 object 上下文

    if (this.lexer.token() == JsonToken.RBRACE) {
      this.lexer.nextToken();
      return ctx;
    }

    if (this.lexer.token() == JsonToken.LITERAL_STRING && this.lexer.stringValue().length == 0) {
      this.lexer.nextToken();
      return ctx;
    }
    // object , '{' 或 ','
    if (this.lexer.token() != JsonToken.LBRACE && this.lexer.token() != JsonToken.COMMA) {
      throw new Error("syntax error, expect {, actual " + this.lexer.tokenName() + ", " + this.lexer.info());
    }

    let setContextFlag = false;

    let cmmntBuf = '';
    let itemCtx: ParseContext;

    for (; ;) {
      this.lexer.skipWhitespace();
      let ch = this.lexer.getCurrent();
      // 是否允许多余的 ','
      // if (lexer.isEnabled(Feature.AllowArbitraryCommas)) {
      while (ch == char(',')) {
        this.lexer.next();
        this.lexer.skipWhitespace();
        ch = this.lexer.getCurrent();
      }
      // }

      // 可能上次遇到 ',' continue 过来的, 行尾注释还没有处理
      // @ts-ignore
      if (itemCtx ) {
        // ',' continue 过来的, item 开始的 cmmntBuf 还没来得及取走
        itemCtx.comment += cmmntBuf;
        if (this.lexer.wsLfCnt == 0) {
          itemCtx.comment += this.lexer.scanComment(true);
          ch = this.lexer.getCurrent();
        }
      }
      // 下一个 ctx 的, 寄存之
      cmmntBuf = this.lexer.scanComment();
      ch = this.lexer.getCurrent();

      let isObjectKey = false;
      let key: any;
      if (ch == char('"')) {
        key = this.lexer.scanSymbol('"');
        this.lexer.skipWhitespace();
        ch = this.lexer.getCurrent();
        if (ch != char(':')) {
          throw new Error("expect ':' at " + this.lexer.pos + ", name " + key);
        }
      } else if (ch == char('}')) {
        this.lexer.next();
        this.lexer.resetStringPosition();
        this.lexer.nextToken();

        if (!setContextFlag) {
          if (this.context != null /*&& fieldName == this.context.key && ctx == this.context.value*/) { // ? key一样, value一样, 什么场景会发生?
            context = this.context; // 不变
          } else {
            let contextR: ParseContext = new JsonObjectContext(this.context, key);
            if (context == null) {
              context = contextR;
            }
            setContextFlag = true;
          }
        }

        // context.comment += this.lexer.resetCommentBuff(); // root 尾部注释(可能行头注释还没来得及取. 交给调用者结束后取)
        return context;
      } else if (ch == char('\'')) {
        key = this.lexer.scanSymbol('\'');
        this.lexer.skipWhitespace();
        ch = this.lexer.getCurrent();
        if (ch != char(':')) {
          throw new Error("expect ':' at " + this.lexer.pos + ", name " + key);
        }
      } else if (ch == JsonLexer.EOI) {
        throw new Error("syntax error");
      } else if (ch == char(',')) {
        throw new Error("syntax error");
      }
      // 数值型 key
      else if ((ch >= char('0') && ch <= char('9')) || ch == char('-')) {
        this.lexer.resetStringPosition();
        this.lexer.scanNumber();
        key = this.lexer.numberValue();
        ch = this.lexer.getCurrent();
        if (ch != char(':')) {
          throw new Error("parse number key error" + this.lexer.info());
        }
      }
          /*暂不考虑 objectKey 场景
          else if (ch == char('{') || ch == char('[')) {
            if (this.objectKeyLevel++ > 512) {
              throw new Error("object key level > 512");
            }
            this.lexer.nextToken();
            key = parse();
            isObjectKey = true;
          }*/
      // 无引号的 key?
      else {
        key = this.lexer.scanSymbolUnQuoted();
        this.lexer.skipWhitespace();
        ch = this.lexer.getCurrent();
        if (ch != char(':')) {
          throw new Error("expect ':' at " + this.lexer.pos + ", actual " + str(ch));
        }
      }

      if (!isObjectKey) {
        this.lexer.next();
        this.lexer.skipWhitespace();
      }

      ch = this.lexer.getCurrent();
      this.lexer.resetStringPosition();

      if (!setContextFlag) {
        if (this.context != null /*&& fieldName == this.context.key && ctx == this.context.value*/) { // ? key一样, value一样, 什么场景会发生?
          context = this.context; // 不变
        } else {
          let contextR: ParseContext = new JsonObjectContext(this.context, key);
          if (context == null) {
            context = contextR;
          }
          setContextFlag = true;
        }
      }

      if (key == null) {
        key = "null";
      }

      //-- value
      // 解析 key 结束后, 立马校验了':', 直接看 value

      if (ch == char('"')) {
        this.lexer.scanString();
        let strValue = this.lexer.stringValue();

        /*if (lexer.isEnabled(Feature.AllowISO8601DateFormat)) {
          JSONScanner iso8601Lexer = new JSONScanner(strValue);
          if (iso8601Lexer.scanISO8601DateIfMatch()) {
            value = iso8601Lexer.getCalendar().getTime();
          }
          iso8601Lexer.close();
        }*/

        itemCtx = new JsonItemContext(context, key, strValue);
        context?.add(itemCtx);
      } else if (ch >= char('0') && ch <= char('9') || ch == char('-')) {
        this.lexer.scanNumber();
        const value = this.lexer.numberValue();
        itemCtx = new JsonItemContext(context, key, value);
        context?.add(itemCtx);
      } else if (ch == char('[')) { // fastjson-1.2.73-sources.jar!/com/alibaba/fastjson/parser/DefaultJSONParser.java:507
        this.lexer.nextToken();

        const parentIsArray = fieldName != null && fieldName instanceof Number;

        if (fieldName == null) { // root?
          this.context = context;
        }

        itemCtx = new JsonArrayContext(context, key);
        this.parseArray(itemCtx, key); // 内部不需要 new context 了, item 直接添加. 由于传入 itemCtx 下面要复位位它的上层context

        context?.add(itemCtx);

        if (this.lexer.token() == JsonToken.RBRACE) { // `{... []}`
          itemCtx.comment += cmmntBuf + this.lexer.resetCommentBuff(); // k:[] nextToken 得到的尾注释
          this.lexer.nextToken(); // '}' 以及后面的 comment(不能追加给当前 item, 需要在 resetCommentBuff 后执行)
          ctx.comment += this.lexer.resetCommentBuff(); // root 尾部注释
          return ctx;
        } else if (this.lexer.token() == JsonToken.COMMA) { // `k: [],`
          continue;
        } else {
          throw new Error("syntax error");
        }
      } else if (ch == char('{')) { // fastjson-1.2.73-sources.jar!/com/alibaba/fastjson/parser/DefaultJSONParser.java:537
        this.lexer.nextToken();

        const parentIsArray = fieldName != null && fieldName instanceof Number;

        // if (!parentIsArray) { // key: {...}
        //   context = new JsonObjectContext(context);
        // }
        itemCtx = new JsonObjectContext(context, key);
        this.parseObject(itemCtx, key);

        context?.add(itemCtx);

        if (this.lexer.token() == JsonToken.RBRACE) { // {...}
          itemCtx.comment += cmmntBuf + this.lexer.resetCommentBuff();
          this.lexer.nextToken();
          this.context = context;
          ctx.comment += this.lexer.resetCommentBuff(); // root 尾部注释
          return ctx;
        } else if (this.lexer.token() == JsonToken.COMMA) {
          this.context = context;
          continue;
        } else {
          throw new Error("syntax error, " + this.lexer.tokenName());
        }
      } else {
        this.lexer.nextToken();
        itemCtx = this.parse0(key);

        context?.add(itemCtx);

        if (this.lexer.token() == JsonToken.RBRACE) {
          itemCtx.comment += cmmntBuf + this.lexer.resetCommentBuff();
          this.lexer.nextToken();
          ctx.comment += this.lexer.resetCommentBuff(); // root 尾部注释
          return ctx;
        } else if (this.lexer.token() == JsonToken.COMMA) {
          continue;
        } else {
          throw new Error("syntax error, position at " + this.lexer.pos + ", name " + key);
        }
      }

      itemCtx.comment += cmmntBuf;
      this.lexer.skipWhitespace();
      if (this.lexer.wsLfCnt == 0) {
        // 当前 item context 的行尾注释
        // cmmntBuf += this.lexer.scanComment(true);
        itemCtx.comment += this.lexer.scanComment(true);
      }
      cmmntBuf = '';

      ch = this.lexer.getCurrent();
      if (ch == char(',')) {
        this.lexer.next();
        continue;
      } else if (ch == char('}')) {
        this.lexer.next();
        this.lexer.resetStringPosition();
        this.lexer.nextToken(); // 附带能得到'}'后面的注释
        ctx.comment += this.lexer.resetCommentBuff(); // root 尾部注释

        // this.setContext(object, fieldName);
        // this.setContext(key, value, null); // ? 最后一项, 单独设置一次 context, 意义是什么 ?

        return ctx;
      } else {
        throw new Error("syntax error, position at " + this.lexer.pos + ", name " + key);
      }
    }


    this.context = context; // 复位
  }

  // scanTailComment() {
  //   this.lexer.skipWhitespace();
  //   if (this.lexer.wsLfCnt == 0) {
  //     // 当前 item context 的行尾注释
  //     return this.lexer.scanComment(true);
  //   }
  //   return '';
  // }

  /**
   * fastjson-1.2.73-sources.jar!/com/alibaba/fastjson/parser/DefaultJSONParser.java:1162
   * @param ctx
   * @param fieldName
   */
  parseArray(ctx: JsonArrayContext, fieldName: any) {
    const lexer = this.lexer;

    if (lexer.token() != JsonToken.LBRACKET) {
      throw new Error("syntax error, expect [, actual " + lexer.tokenName() + ", pos "
          + lexer.pos + ", fieldName " + fieldName);
    }

    lexer.nextTokenExpect(JsonToken.LITERAL_STRING);

    // if (this.context != null && this.context.level > 512) {
    //   throw new JSONException("array level > 512");
    // }

    let context = ctx;
    try {
      for (let i = 0; ; ++i) {
        // if (lexer.isEnabled(Feature.AllowArbitraryCommas)) {
        while (lexer.token() == JsonToken.COMMA) {
          lexer.nextToken();
          continue;
        }
        // }

        // @ts-ignore
        let value: ParseContext = null;
        switch (lexer.token()) {
          case JsonToken.LITERAL_NUMBER:
            value = new JsonItemContext(context, i, lexer.numberValue());
            lexer.nextTokenExpect(JsonToken.COMMA);
            break;
          case JsonToken.LITERAL_STRING:
            let stringLiteral = lexer.stringValue();
            lexer.nextTokenExpect(JsonToken.COMMA);

            // if (lexer.isEnabled(Feature.AllowISO8601DateFormat)) {
            //   JSONScanner iso8601Lexer = new JSONScanner(stringLiteral);
            //   if (iso8601Lexer.scanISO8601DateIfMatch()) {
            //     value = iso8601Lexer.getCalendar().getTime();
            //   } else {
            //     value = stringLiteral;
            //   }
            //   iso8601Lexer.close();
            // } else {
            value = new JsonItemContext(context, i, stringLiteral);
            // }

            break;
          case JsonToken.TRUE:
            value = new JsonItemContext(context, i, true);
            lexer.nextTokenExpect(JsonToken.COMMA);
            break;
          case JsonToken.FALSE:
            value = new JsonItemContext(context, i, false);
            lexer.nextTokenExpect(JsonToken.COMMA);
            break;
          case JsonToken.LBRACE:
            let objectCtx = new JsonObjectContext(context, i);
            this.parseObject(objectCtx, i);
            objectCtx.comment += this.lexer.resetCommentBuff();
            value = objectCtx;
            break;
          case JsonToken.LBRACKET:
            let arrayCtx = new JsonArrayContext(context, i);
            this.parseArray(arrayCtx, i);
            value = arrayCtx;
            break;
          case JsonToken.NULL:
            value = new JsonItemContext(context, i, null);
            lexer.nextTokenExpect(JsonToken.LITERAL_STRING);
            break;
          case JsonToken.UNDEFINED:
            value = new JsonItemContext(context, i, null);
            lexer.nextTokenExpect(JsonToken.LITERAL_STRING);
            break;
          case JsonToken.RBRACKET:
            lexer.nextTokenExpect(JsonToken.COMMA);
            return;
          case JsonToken.EOF:
            throw new Error("unclosed jsonArray");
          default:
            // value = parse(); // 暂不考虑
            break;
        }

        value && context.add(value);
        // checkListResolve(array);

        if (lexer.token() == JsonToken.COMMA) {
          lexer.nextTokenExpect(JsonToken.LITERAL_STRING);
          continue;
        }
      }
    } finally {
      // 如 [{}] 内部会改变 this.context, 所以这里一定要复位
      // this.context = context;
      this.context = context.parent ? context.parent : context; // 我这里 context 是传入的 item context
    }
  }

  parse() {
    return this.parse0(null);
  }

  parse0(fieldName: any): ParseContext {
    const lexer = this.lexer;
    const cmmnt = this.lexer.commentBuff + lexer.scanComment();
    this.lexer.commentBuff = '';
    switch (lexer.token()) {
      case JsonToken.LBRACKET:
        let arrayCtx = new JsonArrayContext(this.context, fieldName);
        arrayCtx.key = fieldName;
        arrayCtx.comment += cmmnt;
        this.parseArray(arrayCtx, fieldName);
        return arrayCtx;
      case JsonToken.LBRACE:
        let objectCtx = new JsonObjectContext(this.context, fieldName);
        objectCtx.key = fieldName;
        objectCtx.comment += cmmnt; // 行头注释
        this.parseObject(objectCtx, fieldName);
        objectCtx.comment += this.lexer.resetCommentBuff(); // 行尾注释
        return objectCtx;
      case JsonToken.LITERAL_NUMBER:
        let n = lexer.numberValue();
        lexer.nextToken();
        return new JsonItemContext(this.context, fieldName, n);
      case JsonToken.LITERAL_STRING:
        let s = lexer.stringValue();
        lexer.nextTokenExpect(JsonToken.COMMA);
        return new JsonItemContext(this.context, fieldName, s);
      case JsonToken.NULL:
        lexer.nextToken();
        return new JsonItemContext(this.context, fieldName, null);
      case JsonToken.UNDEFINED:
        lexer.nextToken();
        return new JsonItemContext(this.context, fieldName, undefined);
      case JsonToken.TRUE:
        lexer.nextToken();
        return new JsonItemContext(this.context, fieldName, true);
      case JsonToken.FALSE:
        lexer.nextToken();
        return new JsonItemContext(this.context, fieldName, false);
      case JsonToken.EOF:
        if (lexer.isBlankInput()) {
          return new ParseContext(this.context);
        }
        throw new Error("unterminated json string, " + lexer.info());
      case JsonToken.ERROR:
      default:
        throw new Error("syntax error, " + lexer.info());
    }
  }

  // setContext(key: any, value: any, parent: JsonContext|null) {
  //   parent = parent || this.context;
  //   this.context = new ParseContext(key, value, parent);
  //   this.contextArray.push(this.context);
  //   return this.context;
  // }

}

/**
 * {...}, [...], 字段k-v 都可以认为是 context
 */
class ParseContext {
  key = null;
  // 简单值时用
  value = null;
  // {},[] 时用
  children: ParseContext[] = [];
  parent: ParseContext | null = null;
  comment = '';
  commentMeta: CommentMeta | null = null;
  type: ItemType = ItemType.OBJECT;

  constructor(parent: ParseContext | null) {
    this.parent = parent;
  }

  add(item: ParseContext) {
    this.children.push(item);
  }

  /**
   * ! 需要在comment就绪后再调用 ! 解析后, comment 变化了, 也不会再次解析的
   */
  parseComment() {
    if (!this.commentMeta) {
      this.commentMeta = new CommentMeta(this.comment);

      // children
      this.children.forEach(child => {
        child.parseComment();
      })
    }
    return this.commentMeta;
  }

  // toString() {
  //   return `${this.comment}\n${this.key}: ${this.value}\nchildren: ${this.children}`
  // }
}

/**{...}*/
class JsonObjectContext extends ParseContext {
  constructor(parent: ParseContext | null, key: any) {
    super(parent);
    this.key = key;
    this.type = ItemType.OBJECT;
  }
}

/**[...]*/
class JsonArrayContext extends ParseContext {
  constructor(parent: ParseContext | null, key: any) {
    super(parent);
    this.key = key;
    this.type = ItemType.ARRAY;
  }
}

class JsonItemContext extends ParseContext {

  constructor(parent: ParseContext | null, key: any, value: any) {
    super(parent);
    this.key = key;
    this.value = value;
    let type = ItemType.OBJECT;
    if (value != null) { // null | undefined -> OBJECT
      const t = typeof value;
      switch (t) {
        case "string":
          type = ItemType.STRING;
          break;
        case "number":
          type = isIntNumber(value) ? ItemType.INT_NUMBER : ItemType.FLOAT_NUMBER;
          break;
        case "bigint":
          type = ItemType.INT_NUMBER;
          break;
        case "boolean":
          type = ItemType.BOOL;
          break;
        case "object":
          type = Array.isArray(value) ? ItemType.ARRAY : ItemType.OBJECT;
          break;
        default:
          type = ItemType.OBJECT;
      }
    }

    this.type = type;
  }
}


class CommentMeta {
  static readonly N_LINE_RE = /^(.*)(\n+|$)/;
  static readonly SINGLE_LINE_CMMT_RE = /^\/\/\s*(.*?)\s*$/;
  static readonly WORD_RE = /^(\S+)/;
  static readonly SPACE_RE = /^(\s+)/;
  /**
   * scdValue 可选的 scdKey
   */
  static readonly OPTIONAL_SCD_VALUE_SCD_KEY_SET = new Set(['required'])

  /**
   * 原始注释内容
   */
  comment: StringNN;
  /**
   * 剔除注释符号后的注释内容
   */
  pureComment: StringNN;
  /**
   * json schema 相关的规范描述. 如: {"minLength": 2, "maxLength": 3}
   */
  schemaDescriptor: Record<string, unknown> = {};

  constructor(comment: StringNN) {
    this.comment = comment;
    this.parse();
  }

  /**
   * 逐行, 找 "@xxx yyy" 提取, 放入 schemaDescriptor
   */
  parse() {
    if (!this.comment) {
      return null;
    }
    let pure = '';
    let src = this.comment;
    while (src) {
      let exec = CommentMeta.N_LINE_RE.exec(src);
      if (!exec) {
        // 理论不会匹配不到
        break;
      }
      src = src.substr(exec[0].length);

      const line = exec[1].trim();
      if (!line) {
        // 空行
        pure += '\n';
        continue;
      }

      // exec = /^\s+$/.exec(line);
      // if (exec) {
      //   pure += '\n';
      //   src = src.substr(exec[0].length);
      //   continue;
      // }

      let pureLine;
      // "// ...."
      exec = /^\s*(\/\/\s*).*?/.exec(line);
      if (exec) {
        pureLine = line.substr(exec[0].length);
      } else {
        // "/** ..." | "/* ..." | "* ..."
        exec = /^\s*(\/\*\*?\s*).*?|^\s*(\*\s*).*?/.exec(line);
        if (exec) {
          if (line.endsWith("*/")) {
            if (line.length == 2) {
              // "*/" 单独占一行
              pureLine = '';
            } else {
              pureLine = line.substring(exec[0].length, line.length - 2);
            }
          } else {
            pureLine = line.substr(exec[0].length);
          }
        }
      }

      // 暂, 不讲 scd k-v 扣除
      pure += (pure ? "\n" + pureLine : pureLine);

      let scdKey;
      let esc;
      for (let i = 0; i < pureLine.length;) { // 注释, 0 位置不会是有效内容的; !! 逢 continue 要考虑在前面++
        let curr = pureLine.charAt(i);
        if (curr == ' ' || curr == '\t') {
          i++
          continue;
        }
        /*if (curr == '\\') {
          if (pureLine.charAt(i - 1) != '\\') {
            esc = true;
            i++
            continue;
          }
          // 连续 \\
          if (esc) {
            esc = false; // 后面
          } else {
            esc = true; // 我是转义咯
          }

          i++
          continue;
        }*/

        if (curr == '@' && pureLine.charAt(i-1) != '\\' && i < pureLine.length - 1) { // 考虑 '@' 占一位
          const w = CommentMeta.WORD_RE.exec(pureLine.substr(i+1, 256));
          if (w) {
            scdKey = w[1];
          } else {
            i++
            continue; // 没有 scdKey, 忽略孤零零的 '@'
          }

          i += w[0].length + 1;
          // continue; // 往下走, 防止 @required 这种无需value的遗漏咯
        }

        if (scdKey != undefined) {
          // scdValue TO-DO 支持 " ' 包裹
          /*
           * scdKey 后内容, 直到下一个 scdKey 出现
           */
           let scdValue = '';
          while (i < pureLine.length) {
            let scdValueExec = CommentMeta.SPACE_RE.exec(pureLine.substr(i));
            if (scdValueExec) {
              // 开头的空白符不累加
              scdValue && (scdValue += scdValueExec[0]);
              i += scdValueExec[0].length
              continue;
            }
            scdValueExec = CommentMeta.WORD_RE.exec(pureLine.substr(i));
            if (!scdValueExec) {
              // 没有内容了, not possible
              break;
            }
            if (scdValueExec[0].startsWith("@")) {
              // i-- 抵消下文i++的影响
              --i;
              break; // 下一个 scdKey, i不位移
            }
            scdValue += scdValueExec[0];
            i += scdValueExec[0].length;
          }
          /*暂不做有效性校验, 一股脑放入*/
          debugger
          if (scdKey == 'mock') {
            debugger;
          }
          const parsedScdValue = this.parseScdValue(scdKey, scdValue);
          if (parsedScdValue !== undefined) {
            this.schemaDescriptor[scdKey] = parsedScdValue;
          }

          // 当前的 scdKey 的 scdValue 不论有无, 都要结束当前 k-v
          scdKey = undefined;
        }

        i++;
      }
    }

    this.pureComment = pure;
  }

  parseScdValue(scdKey: string, scdValue: string) {
    scdValue = scdValue?.trim();
    if (!scdValue) {
      if (CommentMeta.OPTIONAL_SCD_VALUE_SCD_KEY_SET.has(scdKey)) {
        return true;
      }
      return undefined;
    }

    if ("true" == scdValue || "TRUE" == scdValue) {
      return true;
    }
    if ("false" == scdValue || "FALSE" == scdValue) {
      return false;
    }

    // 剔除转义, 如 @mock 的 \@datetime
    scdValue = scdValue.replaceAll("\\", "");

    return scdValue;
  }
}

const JSON = {
  parse: (json) => {
    return new JsonParser(json).parse();
  }
}

export default JSON;
export {
  JsonParser,
  ItemType,
  ParseContext,
};

// ---- 测试 ----

// let text = `
// /*hello*/
//
// // 注释区域2
// {
//   // "a": "qwe",
//   // "b": 123.456,
//   // "c": true,
//   // "d": null,
//   // "e": undefined
//   "f": [1,2, "ti"], // fffff
//   // ggg111
//   "g": 6, // ggg222
// }
// `;
// const parser = new JsonParser(text);
// const result = parser.parse();
// console.log(result);
// const parseComment = result.parseComment();
// console.log(parseComment);