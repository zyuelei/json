<script setup lang="ts">import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  watchEffect
} from 'vue';
import dayjs from 'dayjs'
import BraceTemplate from "./BraceTemplate.vue";
import MonacoTemplate from "./MonacoTemplate.vue";
import utf8 from "utf8";
import {config, ContentSelectType, editContentMy, matchRangeMy, rangeMy, supportAutoType} from "../interface";
import {DownOutlined, LockOutlined, SettingOutlined, UnlockOutlined} from '@ant-design/icons-vue';
import {unserialize} from 'serialize-php';
import {message} from 'ant-design-vue';

const emit = defineEmits(['changeTheme'])
const props = defineProps<{
  theme: string
}>()
const theme = ref(props.theme)
const childElementRefs = ref();
const tabsContainerRef = ref();
const showAlt = ref(false)
const contentConfig = reactive<config>({
  fontSize: 14,
  tabSize: 4,
  printMargin: false,
  useWrap: false,
  theme: theme.value,
  render: 'moncaco', // brace  moncaco
})
watchEffect(() => {
  contentConfig.theme = theme.value
  emit('changeTheme', theme.value);
})
// @ts-ignore
window.onPluginEnter && window.onPluginEnter(({payload, type, code}: any) => {
  // console.info('in', payload, type, code);
  switch (code) {
    case "json_format":
      if (type !== 'regex') {
        contentRefSetFocus(50)
        return
      }
      activeKey.value = 0
      setValue(payload);
      break;
    case "get_url_to_json":
      activeKey.value = 0
      setValue(payload, {formatOrder: [supportAutoType.get_param]});
      break;
    case "unserialize_format":
      activeKey.value = 0
      setValue(payload, {formatOrder: [supportAutoType.unserialize]});
      break;
    case "utf8_to_json":
    case "unicode_decode":
    default:
      activeKey.value = 0
      setValue(payload);
      break;
  }
  contentRefSetFocus(50)
})

//{\x22channel\x22:\x22CCPARTNER\x22,\x22member_id\x22:\x2213819765\x22,\x22company_id\x22:\x2254798\x22}
interface panesInterface {
  title: string
  key: number
  closable?: boolean
  content: string
  favorite?: boolean
  time: number,
  render: string
}

const panes = ref<panesInterface[]>([
  {title: 'default', key: 0, closable: false, favorite: true, content: '', time: 0, render: contentConfig.render},
]);
const activeKey = ref(panes.value[0].key);
const activeIndex = computed(() => {
  return panes.value.findIndex(obj => obj.key === activeKey.value)
})

const saveActiveValue = (str: string) => {
  getActive().content = str
}
const favorite = () => {
  getActive().favorite = !getActive().favorite
}
const getFormatData = (str: string, formatParam?: formatParam) => {
  const order = formatParam?.formatOrder ?? [supportAutoType.unicode, supportAutoType.utf8]
  const format = formatParam?.formatOpen ?? true;

  if (!format) {
    return str
  }
  let result = str
  let hasJson = false
  try {
    if (!hasJson && order.includes(supportAutoType.get_param as never)) {
      const paramJson = getParamJson(str)
      if (typeof paramJson === 'object' && JSON.stringify(paramJson) != '{}') {
        result = jsonFormat(paramJson)
        hasJson = true
        // console.info('f:get_param')
      }
    }
  } catch (e) {
    // console.info(e)
  }
  try {
    if (!hasJson) {
      result = getJsonStr(str)
      hasJson = true
      // console.info('f:json')
    }
  } catch (e) {

  }

  try {
    if (!hasJson && order.includes(supportAutoType.unicode as never)) {
      result = unicodeString(result)
      // console.info('f:unicode')
    }
  } catch (e) {

  }

  try {
    if (!hasJson && order.includes(supportAutoType.utf8 as never)) {
      result = utf8String(result)
      // console.info('f:utf8')
    }
  } catch (e) {

  }

  try {
    if (!hasJson && result != str) {
      result = getJsonStr(result)
      hasJson = true
    }
  } catch (e) {

  }
  if (!hasJson && order.includes(supportAutoType.unserialize as never)) {
    const paramJson = getUnSerializeJson(str)
    if (typeof paramJson === 'object' && JSON.stringify(paramJson) != '{}') {
      result = jsonFormat(paramJson)
      hasJson = true
      // console.info('f:unserialize')
    }
  }

  if (!hasJson) {
    try {
      const temp = JSON.parse('{"a":"' + result + '"}')
      const tempJson = getEscapeJson(temp);
      if (typeof tempJson == 'object' && tempJson.a && typeof tempJson.a == 'object') {
        result = jsonFormat(tempJson.a)
        hasJson = true
        // console.info('f:temp')
      }
    } catch (e) {

    }
  }
  return result;
}
// const utf8Verify = (str: string) => {
//   const regex = /^.*(?:\\x[a-f0-9]{2})+.*$/
//   if (!regex.test(str)) {
//     return false
//   }
//   return true
// }

const unicodeString = (str: string): string => {
  return str.replace(/\\u([\dA-Fa-f]{4})|\\x([0-9A-Fa-f]{2})/g, (match, grpU, grpX) => {
    if (grpU) {
      return String.fromCharCode(parseInt(grpU, 16));
    }
    if (grpX) {
      return String.fromCharCode(parseInt(grpX, 16));
    }
    return match;
  });
}


const utf8String = (str: string) => {
  try {
    str = utf8.decode(str);
  } catch (e) {
    // console.info('utf8 err', e)
    throw e
  }
  return str
}
const getJsonStr = (str: string) => {
  try {
    const json = JSON.parse(str)
    if (typeof json !== 'object') {
      throw Error('错误');
    }
    str = jsonFormat(getEscapeJson(json))
  } catch (e) {
    // console.info('json err', str)
    throw e
  }
  return str
}

const getEscapeJson = (json: any) => {
  if (typeof json !== 'object' || json === null) {
    return json;
  }

  const parse = (value: any) => {
    let result
    if (typeof value === 'string') {
      try {
        if (!isNaN(Number(value)) && !isNaN(parseFloat(value))) {
          result = value
        } else {
          const json = JSON.parse(value);
          result = getEscapeJson(json)
        }
      } catch (e) {
        result = value;
      }
    } else if (Array.isArray(value)) {
      result = value.map((item) => getEscapeJson(item));
    } else if (typeof value === 'object') {
      result = getEscapeJson(value);
    } else {
      result = value;
    }
    return result
  }

  if (Array.isArray(json)) {
    json = json.map((item) => getEscapeJson(parse(item)));
    return json
  }

  const escapedJson: any = {};
  for (let key in json) {
    if (json.hasOwnProperty(key)) {
      const value = json[key];
      escapedJson[key] = parse(value)
    }
  }

  return escapedJson;
};


const jsonFormat = (str: object) => {
  return JSON.stringify(str, null, contentConfig.tabSize)
}
//
const jsonArchive = (input: string) => {
  let result = [];
  let quoteChar: any = false;
  input = input.replace(/\n/g, " ");

  for (let currentChar of input) {
    if (quoteChar && currentChar === quoteChar && !result[result.length - 1].endsWith("\\")) {
      quoteChar = false;
    } else if (!quoteChar && (currentChar === '"' || currentChar === "'")) {
      quoteChar = currentChar;
    } else if (!quoteChar && (currentChar === " " || currentChar === "\t")) {
      currentChar = "";
    }
    result.push(currentChar);
  }
  return result.join("");
};
const escapeString = (text: string) => {
  return text.replace(/\\\\/g, "\\").replace(/\\"/g, '"')
}

type formatParam = {
  formatOrder?: supportAutoType[],
  formatOpen?: boolean
}
const setValue = (str?: string, formatParam?: formatParam) => {
  str = str === undefined ? '' : str
  str = getFormatData(str, formatParam);
  saveActiveValue(str)
  contentRefSetVal(str)
}
const getActiveEdit = (): any => {
  return childElementRefs.value[activeIndex.value]
}

const contentRefSetVal = (str: string) => {
  setTimeout(() => {
    getActiveEdit().setVal(str)
  }, 20)
}
const contentRefSetFocus = (timeout?: number) => {
  timeout = timeout || 0
  setTimeout(() => {
    getActiveEdit().focus()
  }, timeout)
}
const getSelectContentData = () => {
  let {selectInfo} = getContentCursorOrAll(ContentSelectType.select);
  return selectInfo.matchText
}

const contentRefInsert = (text: string) => {
  return getActiveEdit().insert(text)
}


const findLineSelectInfo = (contentInfo: editContentMy): matchRangeMy | null => {
  const str = getSubstringByRange(getActive().content, contentInfo)
  if (!str) {
    return null
  }
  return {
    startLine: contentInfo.startLine,
    endLine: contentInfo.endLine,
    startColumn: contentInfo.startColumn,
    endColumn: contentInfo.endColumn,
    matchText: str,
    oldText: str,
    isCursor: true,
    newContent: (str) => {
      const jsonStr = isJson(str);
      if (jsonStr) {
        return {
          isJson: true,
          text: jsonStr
        }
      }
      return {
        isJson: false,
        text: '"' + str + '"'
      }
    }
  }
}

const findLineQuotesInfo = (contentInfo: editContentMy): matchRangeMy | null => {
  let str = getRowData(getActive().content, contentInfo.positionLine)
  let positionColumn = contentInfo.positionColumn - 2
  let startIndex = -1;
  let endIndex = -1;
  if (positionColumn < 0) {
    return null
  }

  // 从指定位置i往前搜索起始双引号
  for (let j = positionColumn; j >= 0; j--) {
    if (str[j] === '"' && str[j - 1] !== '\\') {
      startIndex = j;
      break;
    }
  }

  // 从指定位置i往后搜索结束双引号
  for (let j = positionColumn + 1; j < str.length; j++) {
    if (str[j] === '"' && str[j - 1] !== '\\') {
      endIndex = j;
      break;
    }
  }
  // 提取被双引号包裹的字符串
  if (endIndex !== -1 && startIndex !== -1 && endIndex > startIndex) {
    return {
      startLine: contentInfo.positionLine,
      endLine: contentInfo.positionLine,
      startColumn: startIndex + 1,
      endColumn: endIndex + 2,
      matchText: str.slice(startIndex + 1, endIndex),
      oldText: str,
      isCursor: true,
      newContent: function (str) {
        const jsonStr = isJson(str);
        if (jsonStr) {
          return {
            isJson: true,
            text: jsonStr
          }
        }
        const inQuote = inQuotes(this.oldText, this.startColumn + 1, this.endColumn - 1, false)
        return {
          isJson: false,
          text: inQuote ? '"' + str + '"' : str
        }
      }
    };
  }

  return null; // 没有找到对应的字符串
}
const inQuotes = (str: string, startColumn: number, endColumn: number, allMatchReturn: boolean) => {
  if (startColumn == 1 && endColumn - 1 == str.length) {
    return allMatchReturn
  }
  if (startColumn < 2 || endColumn - 1 > str.length) {
    return false;
  }
  return str[startColumn - 2] == '"' && str[endColumn - 1] == '"'
}
const findLineNumberInfo = (contentInfo: editContentMy): matchRangeMy | null => {
  let str = getRowData(getActive().content, contentInfo.positionLine)
  let positionColumn = contentInfo.positionColumn - 2
  let startIndex = -1;
  let endIndex = -1;
  if (positionColumn < 1) {
    return null
  }

  // 从指定位置i往前搜索起始双引号
  for (let j = positionColumn + 1; j >= 0; j--) {
    if (/\d/.test(str[j]) && !/\d/.test(str[j - 1])) {
      startIndex = j;
      break;
    }
  }
  // 从指定位置i往后搜索结束双引号
  for (let j = positionColumn; j < str.length; j++) {
    if (/\d/.test(str[j]) && !/\d/.test(str[j + 1])) {
      endIndex = j;
      break;
    }
  }
  // 提取被双引号包裹的字符串
  if (endIndex !== -1 && startIndex !== -1 && endIndex > startIndex) {
    return {
      startLine: contentInfo.positionLine,
      endLine: contentInfo.positionLine,
      startColumn: startIndex + 1,
      endColumn: endIndex + 2,
      matchText: str.slice(startIndex, endIndex + 1),
      oldText: str,
      isCursor: true,
      newContent: function (str) {
        let text;
        const inQuote = inQuotes(this.oldText, this.startColumn, this.endColumn, true)
        const isNum = /^\d+$/.test(str) || /^\d+\.\d+$/.test(str)
        if (inQuote || isNum) {
          text = str
        } else {
          text = '"' + str + '"'
        }
        return {
          isJson: false,
          text: text
        }
      }
    };
  }

  return null; // 没有找到对应的字符串
}

const isJson = (value: any, format?: boolean) => {
  format = format || false
  try {
    if (typeof value == 'object') {
      if (format) {
        return jsonFormat(value);
      } else {
        return JSON.stringify(value)
      }
    }
    const json = JSON.parse(value);
    if (typeof json == 'object') {
      if (format) {
        return jsonFormat(json)
      } else {
        return value
      }
    }
  } catch (e) {
  }
  return false;
}

const getParamJson = (paramsString: string) => {
  const paramObj: any = {};
  const queryString = paramsString.replace(/^[^?]*\?/, '');

  let startIndex = 0;
  let endIndex = 0;
  while (startIndex < queryString.length) {
    // 搜索等号位置
    const equalIndex = queryString.indexOf("=", startIndex);
    if (equalIndex === -1) {
      break;
    }
    // 搜索下一个键值对的等号位置
    endIndex = queryString.indexOf("&", equalIndex);
    if (endIndex === -1) {
      endIndex = queryString.length;
    }
    // 取出键和值，并解码
    const key = decodeURIComponent(queryString.slice(startIndex, equalIndex));
    // 将键值对存储到 paramObj
    const val = decodeURIComponent(queryString.slice(equalIndex + 1, endIndex));

    paramObj[key] = val.replace(/\+/g, ' ')
    // 更新下一个的开始位置
    startIndex = endIndex + 1;
  }

  if (Object.keys(paramObj).length === 0) {
    return paramsString;
  }

  return paramObj;
}

const getBase64Json = (str: string) => {
  try {
    return atob(str); // 尝试解码
  } catch (e) {
    try {
      if (str.indexOf('%') != -1) {
        const decode = getUrlDecodeString(str)
        if (decode) {
          return atob(decode)
        }
      }
    } catch (e) {

    }
    throw e
  }
}

function getContentCursorOrAll(type: ContentSelectType) {
  const contentInfo: editContentMy = getActiveEdit().getContentInfo();
  let selectInfo: matchRangeMy | null = null;
  switch (type) {
    case ContentSelectType.line_number:
      selectInfo = findLineNumberInfo(contentInfo);
      break;
    case ContentSelectType.line_quotes:
      selectInfo = findLineQuotesInfo(contentInfo);
      break;
    case ContentSelectType.select:
      selectInfo = findLineSelectInfo(contentInfo);
      break;
  }
  if (selectInfo != null) {
    return {
      contentInfo: contentInfo,
      selectInfo: selectInfo,
    }
  }
  return {
    contentInfo: {...contentInfo},
    selectInfo: {
      isCursor: false,
      startLine: contentInfo.firstLine,
      endLine: contentInfo.lastLine,
      startColumn: contentInfo.firstColumn,
      endColumn: contentInfo.lastColumn,
      matchText: getActive().content as string,
      newContent: function (str) {
        const jsonStr = isJson(str, true);
        if (jsonStr) {
          return {
            isJson: true,
            text: jsonStr
          }
        }
        return {
          isJson: false,
          text: str
        }
      }
    } as matchRangeMy
  }
}

const base64Decode = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;
  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const newData = getBase64Json(parseText)
    if (newData == parseText) {
      contentRefSetFocus()
      return
    }
    replaceNewContent(contentInfo, selectInfo, newData)
  } catch (e) {
  }
  contentRefSetFocus()
}
const getDecode = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;
  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const newData = getParamJson(parseText)
    if (typeof newData !== 'object') {
      contentRefSetFocus()
      return
    }
    replaceNewContent(contentInfo, selectInfo, newData, true)
    contentRefSetFocus()
  } catch (e) {
    console.info(e)
  }
}

function getUrlDecodeString(parseText: string) {
  try {
    return decodeURIComponent(parseText);
  } catch (e) {
    throw e
  }
}

const urlDecode = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;

  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const newData = getUrlDecodeString(parseText)
    if (newData == parseText) {
      contentRefSetFocus()
      return
    }
    replaceNewContent(contentInfo, selectInfo, newData)
    contentRefSetFocus()
  } catch (e) {
  }
}

function replaceNewContent(contentInfo: editContentMy, selectInfo: matchRangeMy, newData: any, noFormat ?: boolean) {
  const newContentInfo = selectInfo.newContent(newData)
  let newContent = newContentInfo.text
  if (!newContent) {
    return
  }
  newContent = typeof newContent == 'object' ? JSON.stringify(newContent) : newContent;
  if (newContentInfo.isJson && noFormat !== true) {

    setValue(getSubstringByTwoRange(getActive().content, newContent, {
      startLine: contentInfo.firstLine,
      startColumn: contentInfo.firstColumn,
      endLine: selectInfo.startLine,
      endColumn: selectInfo.startColumn
    }, {
      startLine: selectInfo.endLine,
      startColumn: selectInfo.endColumn,
      endLine: contentInfo.lastLine,
      endColumn: contentInfo.lastColumn
    }))
  } else {
    getActiveEdit().replace(getActiveEdit().toRange(selectInfo), newContent);
  }
}

const getSubstringByTwoRange = (str: string, connectText: string, rangeOne: rangeMy, rangeTwo: rangeMy): string => {
  return getSubstringByRange(str, rangeOne) + connectText + getSubstringByRange(str, rangeTwo)
}
const getRowData = (str: string, row: number): string => {
  const rows = str.split('\n');
  if (row < 1 || row - 1 >= rows.length) {
    return ''; // 参数错误，返回空字符串
  }

  return rows[row - 1];
}

const getSubstringByRange = (str: string, range: rangeMy): string => {
  const rows = str.split('\n');
  const {startLine, endLine, startColumn, endColumn} = range;

  if (
      startLine > endLine ||
      startLine < 1 ||
      startLine > rows.length ||
      endLine > rows.length ||
      startColumn < 1 ||
      endColumn < 1
  ) {
    return ''; // 参数错误，返回空字符串
  }

  const adjustedStartLine = startLine - 1;
  const adjustedEndLine = endLine - 1;

  // if (adjustedStartLine === adjustedEndLine && startColumn === endColumn) {
  //   return '';
  // }

  let selectedText = "";

  for (let i = adjustedStartLine; i <= adjustedEndLine; i++) {
    const row = rows[i];
    if (i === adjustedStartLine && i === adjustedEndLine) {
      selectedText += row.slice(startColumn - 1, endColumn - 1);
    } else if (i === adjustedStartLine) {
      selectedText += row.slice(startColumn - 1) + "\n";
    } else if (i === adjustedEndLine) {
      selectedText += row.slice(0, endColumn - 1);
    } else {
      selectedText += row + "\n";
    }
  }

  return selectedText;
}
const getUnSerializeJson = (parseText: string) => {
  try {
    return unserialize(parseText)
  } catch (e) {
    const escape = escapeString(parseText)
    if (escape != parseText) {
      try {
        return unserialize(escape)
      } catch (e) {
        throw e
      }
    }
    throw e
  }
}
const unserializeDecode = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;
  if (!parseText) {
    contentRefSetFocus()
    return
  }

  try {
    const newData = getUnSerializeJson(parseText)
    if (newData == parseText) {
      contentRefSetFocus()
      return
    }
    replaceNewContent(contentInfo, selectInfo, newData)
    contentRefSetFocus()
  } catch (e) {
    contentRefSetFocus()
  }
}

const isTimestamp = (str: string | number) => {
  return /^\d{10}$|^\d{13}$/.test(str + '');
}

const isDateTime = (str: string) => {
  const timestamp = Date.parse(str + '');
  return !isNaN(timestamp);
}
//
const getNowTimestamp = () => {
  return Math.floor(Date.now() / 1000);
}

const formatTimeStamp = (str: string, length?: number) => {
  str = '' + str
  const calcLength = str.length == 23 ? 13 : 10;
  length = length || calcLength
  const timestamp = Date.parse(str);
  const timestampString = timestamp.toString();
  return timestampString.substring(0, length);
}

const formateDate = (timestamp: number | string, format?: string) => {
  let length = ('' + timestamp).length;
  if (length == 10) {
    timestamp = parseInt(timestamp + '') * 1000;
    format = format ? format : 'YYYY-mm-dd HH:MM:SS'
  } else if (length == 13) {
    timestamp = parseInt(timestamp + '');
    format = format ? format : 'YYYY-mm-dd HH:MM:SS.SSS'
  }
  if (!format) {
    return ''
  }
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return format
      .replace('YYYY', '' + year)
      .replace('mm', month)
      .replace('dd', day)
      .replace('HH', hour)
      .replace('MM', minute)
      .replace('SS', second)
      .replace('SSS', milliseconds);
}
const timestampDecode = () => {
  if (!timestampTrans()) {
    if (!dateTimeTrans()) {
      const timestamp = getNowTimestamp();
      contentRefInsert(timestamp + '')
      contentRefSetFocus()
    }
  }
  contentRefSetFocus()
}
const timestampTrans = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_number);
  const parseText = selectInfo.matchText;
  try {
    let newData;
    if (isTimestamp(parseText)) {
      // 时间戳支持10 / 13 位
      newData = formateDate(parseText)
    } else {
      return false
    }
    replaceNewContent(contentInfo, selectInfo, newData)
    return true
  } catch (e) {
    console.info(e)
  }
  return false;
}
const dateTimeTrans = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;

  try {
    let newData;
    if (isDateTime(parseText)) {
      // 时间转换
      const timestamp = formatTimeStamp(parseText);
      if (!isTimestamp(timestamp)) {
        return false
      }
      newData = timestamp;
    } else {
      return false
    }
    replaceNewContent(contentInfo, selectInfo, newData)
    return true
  } catch (e) {
  }
  return false;
}


const add = () => {
  const nowTime = new Date().getTime();
  activeKey.value = nowTime;
  panes.value.push({
    title: dayjs(nowTime).format('HH:mm:ss'),
    key: nowTime,
    content: '',
    time: nowTime,
    render: contentConfig.render
  });
};

const remove = (targetKeyStr: string) => {
  const targetKey = parseInt(targetKeyStr)
  let lastIndex = 0;
  panes.value.forEach((pane, i) => {
    if (pane.key === targetKey) {
      lastIndex = i - 1;
    }
  });
  panes.value = panes.value.filter(pane => pane.key !== targetKey);
  if (panes.value.length && activeKey.value === targetKey) {
    if (lastIndex >= 0) {
      activeKey.value = panes.value[lastIndex].key;
    } else {
      activeKey.value = panes.value[0].key;
    }
  }
};
const getActive = (targetKeyStr?: string | number): any => {
  if (targetKeyStr === undefined) {
    targetKeyStr = activeKey.value
  }
  const targetKey = typeof targetKeyStr === "string" ? parseInt(targetKeyStr) : targetKeyStr
  let restult = {}
  panes.value.map((value) => {
    if (value.key === targetKey) {
      restult = value
      return
    }
  })
  return restult
}

const onEdit = (targetKey: string | MouseEvent, action: string) => {
  if (action === 'add') {
    add();
  } else {
    remove(targetKey as string);
  }
  contentRefSetFocus(50);
};

const onChange = ({content, format}: any) => {
  if (format) {
    setValue(content)
  } else {
    saveActiveValue(content)
  }
}


watch(activeKey, () => {
  // setValue(getActive()?.content, false)
  contentRefSetFocus(50);
})
const windowCopy = (text: string) => {
  // @ts-ignore
  window.copyContent && window.copyContent(text)
}

const format = (text ?: string) => {
  const formatText = text ? text : getSelectContentData()
  setValue(formatText)
  contentRefSetFocus()
}
// const copy = () => {
//   const text = contentRefCopy()
//   windowCopy(text)
// }
const archiveCopy = () => {
  const text = getSelectContentData()
  try {
    const archiveText = jsonArchive(text)
    windowCopy(archiveText)
  } catch (e) {
  }
  contentRefSetFocus()
}
const formDataCopy = () => {
  const text = getSelectContentData()
  try {
    const archiveText = getFormDataString(text)
    windowCopy(archiveText)
  } catch (e) {
    message.error('转码失败');
  }
  contentRefSetFocus()
}

function resolveObject(name: string, object: any) {
  let stringToReturn = '';
  for (const [key, value] of Object.entries(object)) {
    if (value instanceof Object) {
      stringToReturn += resolveObject(`${name}[${key}]`, value);
      continue;
    }
    if (value instanceof Array) {
      stringToReturn += resolveArray(`${name}[${key}]`, value);
      continue;
    }
    stringToReturn += `${name}[${key}]:${value}\n`
  }
  return stringToReturn;
}

function resolveArray(name: string, array: any[]) {
  let stringToReturn = '';
  array.forEach((value, index) => {
    if (value instanceof Object) {
      stringToReturn += resolveObject(`${name}[${index}]`, value);
      return;
    }
    if (value instanceof Array) {
      stringToReturn += resolveArray(`${name}[${index}]`, value);
      return;
    }
    stringToReturn += `${name}[${index}]:${value}\n`
  })
  return stringToReturn;
}

const getFormDataString = (jsonValues: string) => {
  const jsonObject = JSON.parse(jsonValues);
  let formDataString = '';
  for (const [key, value] of Object.entries(jsonObject)) {
    if (value instanceof Object) {
      formDataString += resolveObject(key, value);
      continue;
    }
    if (value instanceof Array) {
      formDataString += resolveArray(key, value);
    }
    formDataString += `${key}:${value}\n`
  }
  return formDataString
}
// const paste = () => {
//   // @ts-ignore
//   window.getClipboardContent && window.getClipboardContent((text: string) => {
//     setValue(text)
//   }, () => {
//   })
// }

const pasteOnly = () => {
  // @ts-ignore
  window.getClipboardContent && window.getClipboardContent((text: string) => {
    contentRefInsert(text)
    contentRefSetFocus()
  }, () => {
  })
}
const pasteAndFormat = () => {
  // @ts-ignore
  window.getClipboardContent && window.getClipboardContent((text: string) => {
    format(text)
    contentRefSetFocus()
  }, () => {
  })
}
// const escape = () => {
//   const text = contentRefCopy()
//   if (!text) {
//     return
//   }
//   let res = escapeString(text)
//   if (res == text) {
//     return
//   }
//   add()
//   setValue(res)
//   contentRefSetFocus()
// }
// const escapeCursor = () => {
//   const text = contentRefCursorText()
//   if (!text) {
//     return
//   }
//
//   let jsonText = text.substring(1, text.length - 1);
//   if (!jsonText) {
//     return
//   }
//   let replaceText = escapeString(jsonText)
//   try {
//     JSON.parse(replaceText)
//   } catch (e) {
//     return
//   }
//
//   let content = getActive().content;
//   if (!content) {
//     return
//   }
//
//   const newContent = content.replace(text, replaceText)
//   if (!newContent || newContent == content) {
//     return
//   }
//
//   setValue(newContent)
// }
const handleTabMenuClick = (clickInfo: any) => {
  switch (clickInfo.key) {
    case '1':
      panes.value.map((value: any) => {
        if (value.key < activeKey.value && value.favorite !== true && value.key > 0) {
          remove(value.key)
        }
      })
      break;
    case '2':
      panes.value.map((value: any) => {
        if (value.key > activeKey.value && value.favorite !== true && value.key > 0) {
          remove(value.key)
        }
      })
      break;
    case '3':
      panes.value.map((value: any) => {
        if (value.key != activeKey.value && value.favorite !== true && value.key > 0) {
          remove(value.key)
        }
      })
      break;
    case '4':
      panes.value.map((value: any) => {
        if (value.key > 0 && value.favorite !== true) {
          remove(value.key)
        }
      })
      break;
    case '5':
      panes.value.map((value: any) => {
        if (value.key > 0) {
          remove(value.key)
        }
      })
      break;
  }
  contentRefSetFocus(20)
}

const handleConfigMenuClick = (clickInfo: any) => {
  switch (clickInfo.key) {
    case "useWrap":
      contentConfig.useWrap = !contentConfig.useWrap;
      break;
    case "switchCode":
      if (getActive().content) {
        message.error('有数据无法切换');
        return
      }
      const nextCodeTemplete: any = {
        brace: 'moncaco',
        moncaco: 'brace'
      };
      const newRender = nextCodeTemplete[getActive().render]
      getActive().render = newRender
      contentConfig.render = newRender
      break;
    case "switchTheme":
      const nextTheme: any = {
        dark: 'light',
        light: 'dark'
      }
      theme.value = nextTheme[theme.value]
      break;
  }
}

const handleResize = () => {
  nextTick(() => {
    const activeTab = tabsContainerRef.value[activeIndex.value]
    const dimension = {
      height: activeTab.offsetHeight,
      width: activeTab.offsetWidth,
    };
    childElementRefs.value.map((child: any) => {
      child.$el.style.height = dimension.height + 'px'
      child.$el.style.width = dimension.width + 'px'
      child.resize && child.resize(dimension)
    })
  })
};

const handleKeyDown = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase()
  if (!(e.ctrlKey || e.altKey || e.metaKey)) {
    return;
  }
  switch (key) {
    case 'control':
    case 'meta':
    case 'alt':
      showAlt.value = true;
      break;
    case 'tab':
      let nextKey;
      if (e.shiftKey) {
        nextKey = activeIndex.value - 1;
        if (nextKey < 0) nextKey = panes.value.length - 1;
      } else {
        nextKey = activeIndex.value + 1;
        if (nextKey >= panes.value.length) nextKey = 0;
      }
      activeKey.value = panes.value[nextKey].key;
      e.preventDefault()
      break;
    case 'w':
    case 'q':
      if (activeKey.value == 0 || getActive().favorite) {
        return
      }
      remove(activeKey.value.toString())
      e.preventDefault()
      break;
    case 'n':
      add()
      setTimeout(() => {
        pasteAndFormat()
      }, 30)
      e.preventDefault()
      break;
    case 't':
      add()
      e.preventDefault()
      break;
    case 'l':
      if (activeKey.value == 0) {
        return
      }
      favorite()
      e.preventDefault()
      break;
    case '0':
      pasteOnly()
      e.preventDefault()
      break;
    case '1':
      getDecode()
      e.preventDefault()
      break;
    case '2':
      urlDecode()
      e.preventDefault()
      break;
    case '3':
      base64Decode()
      e.preventDefault()
      break;
    case '4':
      unserializeDecode()
      e.preventDefault()
      break;
    case '5':
      timestampDecode()
      e.preventDefault()
      break;
  }

}

const handleKeyUp = () => {
  showAlt.value = false
}
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('keydown', handleKeyDown)
});

</script>

<template>
  <div :class="`container ` + theme">
    <a-tabs class="tabs" v-model:activeKey="activeKey" type="editable-card" @edit="onEdit">
      <template #rightExtra>
        <a-button style="height: 100%" :disabled="activeKey == 0" @click="favorite">
          <LockOutlined v-if="!getActive().favorite"/>
          <UnlockOutlined v-if="getActive().favorite"/>
        </a-button>
        <a-dropdown>
          <template #overlay>
            <a-menu @click="handleTabMenuClick">
              <a-menu-item key="1">
                关闭左侧
              </a-menu-item>
              <a-menu-item key="2">
                关闭右侧
              </a-menu-item>
              <a-menu-item key="3">
                关闭其他
              </a-menu-item>
              <a-menu-item key="4">
                关闭全部
              </a-menu-item>
              <a-menu-item key="5">
                强制关闭全部
              </a-menu-item>
            </a-menu>
          </template>
          <a-button style="height: 100%">
            <DownOutlined/>
          </a-button>
        </a-dropdown>

        <a-dropdown placement="top">
          <a-button style="height: 100%">
            <SettingOutlined/>
          </a-button>
          <template #overlay>
            <a-menu @click="handleConfigMenuClick">
              <a-menu-item style="width: 100px" key="useWrap">
                切换换行
              </a-menu-item>
              <a-menu-item style="width: 100px" key="switchTheme">
                切换主题
              </a-menu-item>
              <a-menu-item style="width: 100px" key="switchCode">
                切换渲染器
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

      </template>
      <a-tab-pane v-for="pane in panes" :key="pane.key" :tab="pane.title" :closable="pane.closable || !pane.favorite"
                  style="height: 100%;width: 100%;">
        <div ref="tabsContainerRef" style="height: 100%; width: 100%;overflow: hidden;">
          <BraceTemplate v-if="pane.render == 'brace'"
                         ref="childElementRefs"
                         :config="contentConfig"
                         @onChange="onChange"></BraceTemplate>
          <MonacoTemplate v-if="pane.render == 'moncaco'"
                          ref="childElementRefs" :config="contentConfig"
                          @onChange="onChange"></MonacoTemplate>
        </div>
      </a-tab-pane>
    </a-tabs>

    <a-space :size="4" style="justify-content:end;margin: 2px 14px 2px 14px;">

      <div>
<!--        <a-button @click="format()">格式化</a-button>-->
        <!--      <a-button @click="paste">粘贴</a-button>-->
        <!--      <a-button @click="copy">复制</a-button>-->
        <a-button @click="archiveCopy">复制压缩</a-button>
        <a-button @click="formDataCopy">复制form</a-button>
        <a-button @click="pasteOnly">仅粘贴 {{ showAlt ? '0' : '' }}</a-button>
        <!--      <a-button @click="escape">去除转义</a-button>-->
        <!--      <a-button @click="escapeCursor">光标处去转义</a-button>-->
        <!--      <a-button @click="showModal">历史</a-button>-->
        <a-button @click="getDecode">get参数 {{ showAlt ? '1' : '' }}</a-button>
        <a-button @click="urlDecode">url_decode {{ showAlt ? '2' : '' }}</a-button>
        <a-button @click="base64Decode">base64_decode {{ showAlt ? '3' : '' }}</a-button>
        <a-button @click="unserializeDecode">unserialize {{ showAlt ? '4' : '' }}</a-button>
        <a-button @click="timestampDecode">timestamp {{ showAlt ? '5' : '' }}</a-button>

      </div>

    </a-space>

    <div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-content: center;
  flex-direction: column;
}

.tabs {
  flex: 1;
  overflow: hidden;
}

/*:deep(.ant-space-item) {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
  //margin-right: 4px !important;
}*/

:deep(.ant-tabs-content) {
  height: 100%;
}

:deep(.ant-tabs-extra-content) {
  height: 100%;
}

.dark :deep(.ant-tabs-nav-more) {
  color: rgba(255, 255, 255, 0.85);
}

.dark {
  background: #303133;
}
</style>
