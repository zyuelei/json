<script setup lang="ts">
import {h, nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import BraceTemplate from "./BraceTemplate.vue";
import MonacoTemplate from "./MonacoTemplate.vue";
import Setting from "./Setting.vue";
import Archive from "./Archive.vue";

import {
  configListenerInterface,
  ContentSelectType,
  editContentMy,
  matchRangeMy,
  rangeMy,
  supportAutoType,
  supportEditTemplateType
} from "../interface";
import {DownOutlined, EditOutlined, LockOutlined, SettingOutlined, UnlockOutlined} from '@ant-design/icons-vue';
import {Input, message, Modal} from 'ant-design-vue';
import {
  base64Decode,
  escapeDecode,
  extractJson,
  formEncode,
  getParamDecode,
  jsonArchive,
  jsonDecode,
  jsonEncode,
  serializeDecode,
  timeDecode,
  timeEncode,
  unicodeDecode,
  urlDecode
} from "../tools/AllEncoder";
import {
  windowCopy,
  windowGetClipboardContent,
  windowIsMac,
  windowPluginEnter,
  windowValidStr
} from "../tools/windowTool.ts";
import {useDoubleShiftDetector, useSetConfigDetector, useSetValueDetector} from "../tools/detector";

const childElementRefs = ref();
const tabsContainerRef = ref();
const showAltAlert = ref(false)
const settingShow = ref(false)

const onConfigChange: configListenerInterface = (key, value) => {
  switch (key) {
    case 'theme':
      theme.value = value as string;
      break;
  }
};
const {getConfig, unConfigChange} = useSetConfigDetector({
  onConfigChange
})
const theme = ref<string>(getConfig('theme'));

const activeKey = ref(0);
const {
  panesData,
  activeIndex,
  activeData,
  setSaveValue,
  loadData,
  addData,
  deleteData,
  tabOperate,
  calcNextKey
} = useSetValueDetector({
  activeKey,
})

windowPluginEnter(({payload, type, code}) => {
  const switchTab = () => {
    if (getConfig('defaultNewTab')) {
      addTab();
    } else {
      setActiveKey(0)
    }
  }
  switch (code) {
    case "json_format":
      if (type === 'regex') {
        switchTab();
        setValue(payload);
      }
      break;
    case "json_trim_format":
      switchTab();
      setValue(payload, {formatOrder: [supportAutoType.extractJson]});
      break;
    case "get_url_to_json":
      switchTab();
      setValue(payload, {formatOrder: [supportAutoType.get_param]});
      break;
    case "unserialize_format":
      switchTab();
      setValue(payload, {formatOrder: [supportAutoType.unserialize]});
      break;
    case "unicode_decode":
    default:
      switchTab();
      setValue(payload);
      break;
  }

  loadData()
  contentRefSetFocus(50)
})

const getFormatData = (str: string, formatParam?: formatParam) => {
  const order = formatParam?.formatOrder ?? getConfig('autoFormat')
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
        result = jsonEncode(paramJson, getConfig('tabSize'))
        hasJson = true
      }
    }
  } catch (e) {
    // console.info(e)
  }


  if (!hasJson && order.includes(supportAutoType.unserialize as never)) {
    const paramJson = serializeDecode(str)
    if (typeof paramJson === 'object' && jsonEncode(paramJson) != '{}') {
      result = jsonEncode(paramJson, getConfig('tabSize'))
      hasJson = true
      // console.info('f:unserialize')
    }
  }

  let dealResult = result;
  try {
    if (!hasJson && order.includes(supportAutoType.archive as never)) {
      dealResult = jsonArchive(dealResult)
    }
  } catch (e) {
  }

  try {
    if (!hasJson && order.includes(supportAutoType.extractJson as never)) {
      dealResult = extractJson(dealResult)
    }
  } catch (e) {
  }

  if (!hasJson) {
    try {
      // const temp = jsonDecode()
      const tempJson = escapeDecode(dealResult);
      if (tempJson && typeof tempJson == 'object' && JSON.stringify(tempJson) !== '[]' && JSON.stringify(tempJson) !== '{}') {
        result = jsonEncode(tempJson, getConfig('tabSize'))
        hasJson = true
        // console.info('f:temp')
      }
    } catch (e) {

    }
  }

  if (!hasJson) {
    try {
      const tempJson = escapeDecode(unicodeDecode(dealResult));
      if (tempJson && typeof tempJson == 'object' && JSON.stringify(tempJson) !== '[]' && JSON.stringify(tempJson) !== '{}') {
        result = jsonEncode(tempJson, getConfig('tabSize'))
        hasJson = true
      }
    } catch (e) {

    }
  }

  try {
    if (!hasJson && order.includes(supportAutoType.unicode as never)) {
      result = unicodeDecode(result)
    }
  } catch (e) {
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
  setSaveValue('content', str)
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
        return jsonEncode(value, getConfig('tabSize'));
      } else {
        return jsonEncode(value)
      }
    }
    const json = jsonDecode(value);
    if (typeof json == 'object') {
      if (format) {
        return jsonEncode(json, getConfig('tabSize'))
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

const onBase64Decode = () => {
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
const onGetDecode = () => {
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


const onUrlDecode = () => {
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

const onUnserializeDecode = () => {
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

const onUnicodeDecode = () => {
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


const onTimestampDecode = () => {
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
  addData(nowTime)
  setActiveKey(nowTime)
};

const removeTab = (targetKeyStr: string) => {
  const targetKey = parseInt(targetKeyStr)
  deleteData(targetKey)
}

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
    setSaveValue('content', content)
  }
}

const setActiveKey = (value: number) => {
  activeKey.value = value;
  if (activeData.value.init == false) {
    contentRefSetVal(activeData.value.content)
    handleResize()
    activeData.value.init = true
  }
  contentRefSetFocus(50);
};

function initVal() {
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
  if (clickInfo.key == 'forceCloseAll') {
    Modal.confirm({
      title: '强制关闭全部',
      okText: '确认',
      cancelText: '取消',
      content: '强制关闭会关闭锁定状态的tab，请谨慎',
      maskClosable: true,
      onOk: () => {
        tabOperate(clickInfo.key)
        contentRefSetFocus(20)
      },
      onCancel() {
        contentRefSetFocus(20)
      }
    })
  } else {
    tabOperate(clickInfo.key)
    contentRefSetFocus(20)
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

const {handleDoubleShiftKeyDown} = useDoubleShiftDetector({
  onDoubleShift: () => {
    renameShowModel();
  },
  preventDefault: true,
})

const listenCodeShortcutKey = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase()
  const isMac = windowIsMac()
  const listenKey = isMac ? e.metaKey || e.altKey : e.ctrlKey || e.altKey;
  if (!listenKey) {
    return;
  }
  switch (key) {
    case 'alt':
      break;
    case 'tab':
      setActiveKey(calcNextKey(e.shiftKey))
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
      setSaveValue('favorite', !activeData.value.favorite)
      break;
    case 'enter':
      format()
      break;
    case '1':
      onGetDecode()
      break;
    case '2':
      onUrlDecode()
      break;
    case '3':
      onBase64Decode()
      break;
    case '4':
      onUnserializeDecode()
      break;
    case '5':
      onTimestampDecode()
      break;
    case '6':
      onUnicodeDecode()
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

const handleKeyDown = (e: KeyboardEvent) => {
  if (getConfig('doubleShiftKeyDown')) {
    handleDoubleShiftKeyDown(e);
  }
  listenCodeShortcutKey(e);
}

const handleKeyUp = () => {
  showAltAlert.value = false
}
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  unConfigChange(onConfigChange)
});

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize);
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('keydown', handleKeyDown)
  // tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp"
  contentRefSetFocus();
});

let renameModal: any;

function renameShowModel() {
  const inputValue = ref('');
  const inputRef = ref<InstanceType<typeof HTMLInputElement> | null>(null);
  const destroy = () => {
    renameModal && renameModal.destroy();
  }
  const done = () => {
    if (windowValidStr(inputValue.value)) {
      message.error('不可包含特殊字符串');
      return false;
    }
    inputValue.value && setSaveValue('title', inputValue.value)
    destroy();
    contentRefSetFocus();
  }
  const handleKeyPress = (event: any) => {
    // 检查是否是回车键
    if (event.key === 'Enter') {
      done();
    }
  };
  const inputComponent = {
    render() {
      return h(Input, {
        ref: inputRef,
        status: windowValidStr(inputValue.value) ? 'error' : '',
        modelValue: inputValue.value, // 绑定输入值
        onInput: (event: any) => {    // 使用 onInput 代替 onUpdate:modelValue
          inputValue.value = event.target.value;  // 更新输入值
        },
        onKeyup: handleKeyPress,
      });
    },
    mounted() {
      // 当组件挂载完成后，输入框自动聚焦
      nextTick(() => {
        setTimeout(() => {
          inputRef.value?.focus();
        }, 10)
      })
    },
  };
  destroy()
  renameModal = Modal.info({
    title: '修改tab名',
    content: h(inputComponent),
    maskClosable: true,
    onOk: done,
    onCancel: contentRefSetFocus
  });
}
</script>

<template>
  <div :class="`container ` + theme">
    <a-tabs forceRender class="tabs" v-model:activeKey="activeKey" @change="setActiveKey" type="editable-card"
            @edit="onEdit">
      <template #rightExtra>
        <a-button style="height: 100%" :disabled="activeKey == 0"
                  @click="setSaveValue('favorite', !activeData.favorite)">
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

        <a-button @click="settingShow=true" style="height: 100%">
          <SettingOutlined/>
        </a-button>
      </template>
      <a-tab-pane forceRender v-for="pane in panesData" :key="pane.key" :tab="pane.title"
                  :closable="pane.closable || !pane.favorite"
                  style="height: 100%;width: 100%;">
        <div ref="tabsContainerRef" style="height: 100%; width: 100%;">
          <BraceTemplate v-if="pane.render == supportEditTemplateType.brace"
                         ref="childElementRefs"
                         @onChange="onChange" @format="format()" @onInit="initVal()"></BraceTemplate>
          <MonacoTemplate v-if="pane.render == supportEditTemplateType.monaco"
                          ref="childElementRefs"
                          @onChange="onChange" @format="format()" @onInit="initVal()"></MonacoTemplate>
        </div>
      </a-tab-pane>
    </a-tabs>

    <a-space :size="4" style="width:100%;justify-content:end;padding: 2px 14px 2px 4px;">

      <div style="width:100%;display: flex;flex-direction: row;justify-content: space-between">
        <div>
          <a-button style="height: 100%" @click="renameShowModel">
            <EditOutlined/>
          </a-button>
        </div>
        <div>
          <a-button class="operateBtnSmall" @click="onGetDecode">{{ showAltAlert ? '1' : '' }} get</a-button>
          <a-button class="operateBtnSmall" @click="onUrlDecode">{{ showAltAlert ? '2' : '' }} url</a-button>
          <a-button class="operateBtn" @click="onBase64Decode">{{ showAltAlert ? '3' : '' }} base64</a-button>
          <a-button class="operateBtn" @click="onUnserializeDecode">{{ showAltAlert ? '4' : '' }} serialize</a-button>
          <a-button class="operateBtn" @click="onTimestampDecode">{{ showAltAlert ? '5' : '' }} timestamp</a-button>
          <a-button class="operateBtn" @click="onUnicodeDecode">{{ showAltAlert ? '6' : '' }} unicode</a-button>
          <a-button class="operateBtn" @click="formDataCopy">{{ showAltAlert ? '8' : '' }} 复制form</a-button>
          <a-button class="operateBtn" @click="archiveCopy">{{ showAltAlert ? '9' : '' }} 复制压缩</a-button>
          <a-button class="operateBtnSmall" @click="pasteOnly">{{ showAltAlert ? '0' : '' }} 仅粘贴</a-button>
        </div>
      </div>

    </a-space>
    <div>
      <a-drawer
          v-model:open="settingShow"
          @close="contentRefSetFocus"
          title="编辑器设置"
          :body-style="{paddingTop: '2px', height: '100%'}"
          placement="right"
      >
        <a-tabs centered style="height: 100%">
          <a-tab-pane style="height:100%;padding-top:8px;" key="1" tab="归档管理">
            <Archive></Archive>
          </a-tab-pane>
          <a-tab-pane style="margin-top:8px;" key="2" tab="基础设置">
            <Setting></Setting>
          </a-tab-pane>
        </a-tabs>
      </a-drawer>
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
