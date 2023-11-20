<script setup lang="ts">import {
  computed,
  h,
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
import {
  ContentSelectType,
  editContentMy,
  getNextEnumValue,
  matchRangeMy,
  panesInterface,
  rangeMy,
  supportAutoType,
  supportEditTemplateType,
  systemConfig
} from "../interface";
import {DownOutlined, LockOutlined, SettingOutlined, UnlockOutlined} from '@ant-design/icons-vue';
import {message, Modal} from 'ant-design-vue';
import {
  base64Decode,
  escapeDecode,
  formEncode,
  getParamDecode,
  jsonArchive,
  jsonDecode,
  jsonEncode,
  serializeDecode,
  timeDecode,
  timeEncode,
  unicodeDecode,
  urlDecode,
  utf8Decode
} from "../tools/AllEncoder";
import {windowCopy, windowGetClipboardContent, windowIsMac, windowPluginEnter} from "../tools/windowTool.ts";

const emit = defineEmits(['changeTheme'])
const props = defineProps<{
  theme: string
}>()
const theme = ref(props.theme)
const childElementRefs = ref();
const tabsContainerRef = ref();
const showAltAlert = ref(false)
const contentConfig = reactive<systemConfig>({
  fontSize: 14,
  tabSize: 4,
  printMargin: false,
  useWrap: false,
  theme: theme.value,
  render: supportEditTemplateType.monaco, // brace  moncaco
})
watchEffect(() => {
  contentConfig.theme = theme.value
  emit('changeTheme', theme.value);
})
windowPluginEnter(({payload, type, code}) => {
  switch (code) {
    case "json_format":
      if (type === 'regex') {
        activeKey.value = 0
        setValue(payload);
      }
      break;
    case "get_url_to_json":
      activeKey.value = 0
      setValue(payload, {formatOrder: [supportAutoType.get_param]});
      break;
    case "unserialize_format":
      activeKey.value = 0
      setValue(payload, {formatOrder: [supportAutoType.unserialize]});
      break;
    case "unicode_decode":
    default:
      activeKey.value = 0
      setValue(payload);
      break;
  }
  contentRefSetFocus(50)
})

const panes = ref<panesInterface[]>([
  {title: 'default', key: 0, closable: false, favorite: true, content: '', time: 0, render: contentConfig.render},
]);
const activeKey = ref(panes.value[0].key);
const activeIndex = computed(() => {
  return panes.value.findIndex(obj => obj.key === activeKey.value)
})
const activeData = computed(() => {
  return panes.value[activeIndex.value]
})

const saveActiveValue = (str: string) => {
  activeData.value.content = str
}
const favorite = () => {
  activeData.value.favorite = !activeData.value.favorite
}
const getFormatData = (str: string, formatParam?: formatParam) => {
  const order = formatParam?.formatOrder ?? []
  const format = formatParam?.formatOpen ?? true;
  if (!format) {
    return str
  }
  let result = str
  let hasJson = false
  try {
    if (!hasJson && order.includes(supportAutoType.get_param as never)) {
      const paramJson = getParamDecode(str)
      if (typeof paramJson === 'object' && jsonEncode(paramJson) != '{}') {
        result = jsonEncode(paramJson, contentConfig.tabSize)
        hasJson = true
      }
    }
  } catch (e) {
    // console.info(e)
  }


  if (!hasJson && order.includes(supportAutoType.unserialize as never)) {
    const paramJson = serializeDecode(str)
    if (typeof paramJson === 'object' && jsonEncode(paramJson) != '{}') {
      result = jsonEncode(paramJson, contentConfig.tabSize)
      hasJson = true
      // console.info('f:unserialize')
    }
  }

  if (!hasJson) {
    try {
      // const temp = jsonDecode()
      const tempJson = escapeDecode(result);
      if (tempJson && typeof tempJson == 'object') {
        result = jsonEncode(tempJson, contentConfig.tabSize)
        hasJson = true
        // console.info('f:temp')
      }
    } catch (e) {

    }
  }

  if (!hasJson) {
    try {
      // 为了支持微信的   字符
      const tempJson = escapeDecode(jsonArchive(unicodeDecode(result)));
      if (tempJson && typeof tempJson == 'object') {
        result = jsonEncode(tempJson, contentConfig.tabSize)
        hasJson = true
      }
    } catch (e) {

    }
  }

  if (!hasJson) {
    result = unicodeDecode(result)
  }
  return result;
}
//

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
  const str = getSubstringByRange(activeData.value.content, contentInfo)
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
  let str = getRowData(activeData.value.content, contentInfo.positionLine)
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
  let str = getRowData(activeData.value.content, contentInfo.positionLine)
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
  if (!value) {
    return false;
  }
  try {
    if (typeof value == 'object') {
      if (format) {
        return jsonEncode(value, contentConfig.tabSize);
      } else {
        return jsonEncode(value)
      }
    }
    const json = jsonDecode(value);
    if (typeof json == 'object') {
      if (format) {
        return jsonEncode(json, contentConfig.tabSize)
      } else {
        return value
      }
    }
  } catch (e) {
  }
  return false;
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
      matchText: activeData.value.content,
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

const base64Decode111 = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;
  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const newData = base64Decode(parseText)
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
    const newData = getParamDecode(parseText)
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


const urlDecode111 = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;

  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const newData = urlDecode(parseText)
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
  newContent = typeof newContent == 'object' ? jsonEncode(newContent) : newContent;
  if (newContentInfo.isJson && noFormat !== true) {
    const rangeData = getSubstringByTwoRange(activeData.value.content, newContent, {
      startLine: contentInfo.firstLine,
      startColumn: contentInfo.firstColumn,
      endLine: selectInfo.startLine,
      endColumn: selectInfo.startColumn
    }, {
      startLine: selectInfo.endLine,
      startColumn: selectInfo.endColumn,
      endLine: contentInfo.lastLine,
      endColumn: contentInfo.lastColumn
    });
    setValue(rangeData)
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

const unserializeDecode = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;
  if (!parseText) {
    contentRefSetFocus()
    return
  }

  try {
    const newData = serializeDecode(parseText)
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
const utf8Decode111 = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;
  if (!parseText) {
    contentRefSetFocus()
    return
  }

  try {
    const newData = utf8Decode(parseText)
    if (newData == parseText) {
      contentRefSetFocus()
      return
    }
    replaceNewContent(contentInfo, selectInfo, newData)
  } catch (e) {
  }
  contentRefSetFocus()
}
const unicodeDecode111 = () => {
  let {contentInfo, selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
  const parseText = selectInfo.matchText;
  if (!parseText) {
    contentRefSetFocus()
    return
  }

  try {
    const newData = unicodeDecode(parseText)
    if (newData == parseText) {
      contentRefSetFocus()
      return
    }
    replaceNewContent(contentInfo, selectInfo, newData)
  } catch (e) {
  }
  contentRefSetFocus()
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
      newData = timeDecode(parseText)
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
      const timestamp = timeEncode(parseText);
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


const addTab = () => {
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

const removeTab = (targetKeyStr: string) => {
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

const onEdit = (targetKey: string | MouseEvent, action: string) => {
  if (action === 'add') {
    addTab();
  } else {
    removeTab(targetKey as string);
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
  contentRefSetFocus(50);
})


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
    const jsonObject = jsonDecode(text);
    const archiveText = formEncode(jsonObject)
    windowCopy(archiveText)
  } catch (e) {
    message.error('转码失败');
  }
  contentRefSetFocus()
}

const pasteOnly = () => {
  windowGetClipboardContent(function (text: string) {
    contentRefInsert(text)
    contentRefSetFocus()
  });
}
const pasteAndFormat = () => {
  windowGetClipboardContent(function (text: string) {
    format(text)
    contentRefSetFocus()
  });
}

const handleTabMenuClick = (clickInfo: any) => {
  switch (clickInfo.key) {
    case 'closeLeft':
      panes.value.map((value: any) => {
        if (value.key < activeKey.value && value.favorite !== true && value.key > 0) {
          removeTab(value.key)
        }
      })
      break;
    case 'closeRight':
      panes.value.map((value: any) => {
        if (value.key > activeKey.value && value.favorite !== true && value.key > 0) {
          removeTab(value.key)
        }
      })
      break;
    case 'closeOther':
      panes.value.map((value: any) => {
        if (value.key != activeKey.value && value.favorite !== true && value.key > 0) {
          removeTab(value.key)
        }
      })
      break;
    case 'closeAll':
      panes.value.map((value: any) => {
        if (value.key > 0 && value.favorite !== true) {
          removeTab(value.key)
        }
      })
      break;
    case 'forceCloseAll':
      panes.value.map((value: any) => {
        if (value.key > 0) {
          removeTab(value.key)
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
      if (activeData.value.content) {
        message.error('有数据无法切换');
        return
      }
      const newRender = getNextEnumValue(supportEditTemplateType, activeData.value.render)
      activeData.value.render = newRender
      contentConfig.render = newRender
      break;
    case "switchTheme":
      const nextTheme: any = {
        dark: 'light',
        light: 'dark'
      }
      theme.value = nextTheme[theme.value]
      break;
    case 'useDesc':
      const instructions = [
        "默认行为：粘贴自动格式化json，支持unicode字符(如：\\x22、\\u0031)的转码自动格式化 快捷键：ctrl + v",
        "格式化：在【选中处/全局】一些需要二次格式化的时候(如：[get]后)可手动调用 快捷键：ctrl + center / alt + enter",
        "新建tab：ctrl + t / alt + t",
        "新建tab并粘贴格式化：ctrl + n / alt + n",
        "新建tab并粘贴【选中处/光标处】内容格式化：ctrl + j / alt + j",
        "切换tab：ctrl + tab  /  ctrl + shift + tab",
        "关闭tab：ctrl + q / alt + q",
        "锁定/解锁tab：锁定后无法通过[关闭tab]快捷键关闭当前tab 快捷键：ctrl + shift + L / alt + shift + L",
        "get：在【光标处/全局】解析get参数，并尝试转为json 示例：a=1&b=1 快捷键：alt + 1",
        "url：在【光标处/全局】url_decode，并尝试转为json 示例：%7B%22a%22%3A%221%22%7D 快捷键：alt + 2",
        "base64：在【光标处/全局】进行url_decode及base64_decode，并尝试转为json 示例：eyJhIjoiMSJ9 快捷键：alt + 3",
        "serialize：在【光标处/全局】进行unserialize，并尝试转为json 快捷键：alt + 4",
        "timestamp：在【光标处/全局】进行【10位时间戳/y-m-d H:i:s】格式的转换,若无法转换则会插入当前时间的10位时间戳 快捷键：alt + 5",
        "unicode：在【光标处/全局】进行unicode_decode解码，并尝试转为json 示例 \\x22 \\u0031 快捷键：alt + 6",
        "utf8：在【光标处/全局】进行utf8_decode解码。此功能由于大部分可被[unicode]替代所以无界面按钮且未来可能会移除 快捷键：alt + 7",
        "复制form：在【选中处/全局】复制key:value格式的json数据，用于postman等软件的导入 快捷键：alt + 8",
        "复制压缩：在【选中处/全局】复制去除回车、空格后的压缩数据 快捷键：alt + 9",
        "仅粘贴：在【选中处/全局】粘贴，并不做格式化操作 快捷键：alt + 0",
        "注释：【全局】指当前tab内所有内容；【光标处】指被光标在双引号包裹的单行字符串中；【选中处】指光标选中的内容",
        "快捷键仅针对windows的utools环境，其余环境可能会略有不同或无法支持",
      ];

      let content = h('div',
          instructions.map(instruction => h('p', instruction))
      );

      Modal.info({
        width: '100%',
        title: '使用说明',
        wrapClassName: 'useDescContainer',
        okText: '这不是小菜一碟',
        content: content,
      });

      break
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
  const isMac = windowIsMac()
  const listenKey = isMac ? e.metaKey || e.altKey : e.ctrlKey || e.altKey;
  if (!listenKey) {
    return;
  }
  switch (key) {
    case 'alt':
      showAltAlert.value = true;
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
      break;
    case 'w':
    case 'q':
      if (activeKey.value == 0 || activeData.value.favorite) {
        e.preventDefault()
        return
      }
      removeTab(activeKey.value.toString())
      break;
    case 'n':
      addTab()
      setTimeout(() => {
        pasteAndFormat()
      }, 30)
      break;
    case 'j':
      let matchText = '';
      let {selectInfo} = getContentCursorOrAll(ContentSelectType.select);
      if (!selectInfo.matchText || !selectInfo.isCursor) {
        let {selectInfo} = getContentCursorOrAll(ContentSelectType.line_quotes);
        if (!selectInfo.matchText || !selectInfo.isCursor) {
          message.error('选中/光标处无内容')
          e.preventDefault()
          return false;
        }
        matchText = selectInfo.matchText
      } else {
        matchText = selectInfo.matchText
      }
      setTimeout(() => {
        format(matchText)
      }, 30)
      addTab()
      break;
    case 't':
      addTab()
      break;
    case 'l':
      if (activeKey.value == 0) {
        e.preventDefault()
        return
      }
      favorite()
      break;
    case 'enter':
      format()
      break;
    case '1':
      getDecode()
      break;
    case '2':
      urlDecode111()
      break;
    case '3':
      base64Decode111()
      break;
    case '4':
      unserializeDecode()
      break;
    case '5':
      timestampDecode()
      break;
    case '6':
      unicodeDecode111()
      break;
    case '7':
      utf8Decode111()
      break;
    case '8':
      formDataCopy()
      break;
    case '9':
      archiveCopy()
      break;
    case '0':
      pasteOnly()
      break;
    default:
      return;
  }
  e.preventDefault()
}

const handleKeyUp = () => {
  showAltAlert.value = false
}
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
});

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize);
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('keydown', handleKeyDown)
  // tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp"
});

</script>

<template>
  <div :class="`container ` + theme">
    <a-tabs class="tabs" v-model:activeKey="activeKey" type="editable-card" @edit="onEdit">
      <template #rightExtra>
        <a-button style="height: 100%" :disabled="activeKey == 0" @click="favorite">
          <LockOutlined v-if="!activeData.favorite"/>
          <UnlockOutlined v-if="activeData.favorite"/>
        </a-button>
        <a-dropdown>
          <template #overlay>
            <a-menu @click="handleTabMenuClick">
              <a-menu-item key="closeLeft">
                关闭左侧
              </a-menu-item>
              <a-menu-item key="closeRight">
                关闭右侧
              </a-menu-item>
              <a-menu-item key="closeOther">
                关闭其他
              </a-menu-item>
              <a-menu-item key="closeAll">
                关闭全部
              </a-menu-item>
              <a-menu-item key="forceCloseAll">
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
              <a-menu-item style="width: 100px" key="useDesc">
                使用说明
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

      </template>
      <a-tab-pane v-for="pane in panes" :key="pane.key" :tab="pane.title" :closable="pane.closable || !pane.favorite"
                  style="height: 100%;width: 100%;">
        <div ref="tabsContainerRef" style="height: 100%; width: 100%;">
          <BraceTemplate v-if="pane.render == supportEditTemplateType.brace"
                         ref="childElementRefs"
                         :config="contentConfig"
                         @onChange="onChange" @format="format()"></BraceTemplate>
          <MonacoTemplate v-if="pane.render == supportEditTemplateType.monaco"
                          ref="childElementRefs" :config="contentConfig"
                          @onChange="onChange" @format="format()"></MonacoTemplate>
        </div>
      </a-tab-pane>
    </a-tabs>

    <a-space :size="4" style="width:100%;justify-content:end;padding: 2px 14px 2px 14px;">

      <div style="width:100%;display: flex;flex-direction: row;justify-content: end">
        <!--        <a-button @click="format()">格式化</a-button>-->
        <!--      <a-button @click="paste">粘贴</a-button>-->
        <!--      <a-button @click="copy">复制</a-button>-->
        <!--      <a-button @click="escape">去除转义</a-button>-->
        <!--      <a-button @click="escapeCursor">光标处去转义</a-button>-->
        <!--      <a-button @click="showModal">历史</a-button>-->
        <div>
          <a-button class="operateBtnSmall" @click="getDecode">{{ showAltAlert ? '1' : '' }} get</a-button>
          <a-button class="operateBtnSmall" @click="urlDecode111">{{ showAltAlert ? '2' : '' }} url</a-button>
          <a-button class="operateBtn" @click="base64Decode111">{{ showAltAlert ? '3' : '' }} base64</a-button>
          <a-button class="operateBtn" @click="unserializeDecode">{{ showAltAlert ? '4' : '' }} serialize</a-button>
          <a-button class="operateBtn" @click="timestampDecode">{{ showAltAlert ? '5' : '' }} timestamp</a-button>
          <a-button class="operateBtn" @click="unicodeDecode111">{{ showAltAlert ? '6' : '' }} unicode</a-button>
          <!--          <a-button class="operateBtn" @click="utf8Decode">{{showAltAlert ? '}':''}}7 utf8</a-button>-->
          <a-button class="operateBtn" @click="formDataCopy">{{ showAltAlert ? '8' : '' }} 复制form</a-button>
          <a-button class="operateBtn" @click="archiveCopy">{{ showAltAlert ? '9' : '' }} 复制压缩</a-button>
          <a-button class="operateBtnSmall" @click="pasteOnly">{{ showAltAlert ? '0' : '' }} 仅粘贴</a-button>
        </div>
      </div>

    </a-space>
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

:deep(.ant-space-item) {
  width: 100%;
}

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

.operateBtnSmall {
  margin-left: 2px;
  width: 64px;
}

.operateBtn {
  margin-left: 2px;
  width: 84px;
}
</style>
