<script setup lang="ts">import {reactive, ref, toRef, watch, watchEffect} from 'vue';
import dayjs from 'dayjs'
import CodeTemplate from "./CodeTemplate.vue";
import MonacoTemplate from "./MonacoTemplate.vue";
import utf8 from "utf8";
import {config} from "../interface";
import {DownOutlined, LockOutlined, SettingOutlined, UnlockOutlined} from '@ant-design/icons-vue';
import {unserialize} from 'serialize-php';
import {message} from 'ant-design-vue';

const emit = defineEmits(['changeTheme'])
const props = defineProps<{ theme: string }>()
const theme = ref(props.theme)
const childElementRefs = ref([]);
const useCodeTemplate = ref('moncaco')

const contentConfig = reactive<config>({
  fontSize: 14,
  tabSize: 4,
  printMargin: false,
  useWrap: false,
  theme: theme.value
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
        contentRefSetFocus()
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
  contentRefSetFocus()
})

//{\x22channel\x22:\x22CCPARTNER\x22,\x22member_id\x22:\x2213819765\x22,\x22company_id\x22:\x2254798\x22}
interface panesInterface {
  title: string
  key: number
  closable?: boolean
  content: string
  favorite?: boolean
  time: number
}

const panes = ref<panesInterface[]>([
  {title: 'default', key: 0, closable: false, favorite: true, content: '', time: 0},
]);
const activeKey = ref(panes.value[0].key);

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
        console.info('f:get_param')
      }
    }
  } catch (e) {
    console.info(e)
  }

  try {
    if (!hasJson) {
      result = getJsonStr(str)
      hasJson = true
      console.info('f:json')
    }
  } catch (e) {

  }

  try {
    if (!hasJson && order.includes(supportAutoType.unicode as never)) {
      result = unicodeString(result)
      console.info('f:unicode')
    }
  } catch (e) {

  }
  try {
    if (!hasJson && order.includes(supportAutoType.utf8 as never)) {
      result = utf8String(result)
      console.info('f:utf8')
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
      console.info('f:unserialize')
    }
  }

  if (!hasJson) {
    try {
      const temp = JSON.parse('{"a":"' + result + '"}')
      const tempJson = getEscapeJson(temp);
      if (typeof tempJson == 'object' && tempJson.a && typeof tempJson.a == 'object') {
        result = jsonFormat(tempJson.a)
        hasJson = true
        console.info('f:temp')
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
const jsonArchive = (str: string) => {
  let n = [];
  let i: any = !1;
  let r = (str = str.split("\n").join(" ")).length;
  for (let o = 0; o < r; o++) {
    let a = str.charAt(o);
    i && a === i ? "\\" !== str.charAt(o - 1) && (i = !1) : i || '"' !== a && "'" !== a ? i || " " !== a && "\t" !== a || (a = "") : i = a,
        n.push(a)
  }
  str = n.join("")
  return str
}

// const escapeString = (text: string) => {
//   return text.replace(/\\\\/g, "\\").replace(/\\\"/g, '"')
// }
enum supportAutoType {
  'get_param',
  'utf8',
  'unicode',
  'unserialize'
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

const contentRefSetVal = (str: string) => {
  setTimeout(() => {
    getContentRef(activeKey.value).value[0].setVal(str)
  }, 100)
}
const contentRefSetFocus = () => {
  setTimeout(() => {
    getContentRef(activeKey.value).value[0].focus()
  }, 100)
}
const contentRefCopy = () => {
  return getContentRef(activeKey.value).value[0].copy()
}

const contentRefInsert = (text: string) => {
  return getContentRef(activeKey.value).value[0].insert(text)
}

// const contentRefCursorText = () => {
//   return getContentRef(activeKey.value).value[0].cursorText()
// }

const getContentRef = (index: number): any => {
  if (!childElementRefs.value[index]) {
    // @ts-ignore
    childElementRefs.value[index] = ref();
  }
  return childElementRefs.value[index];
}

const contentRefCursorText = () => {
  return getContentRef(activeKey.value).value[0].cursorText()
}
// const getParamJson = (paramsString: string) => {
//   const paramObj: any = {};
//   const queryString = paramsString.replace(/^[^?]*\?/, '');
//   const paramsArr = queryString.split("&");
//
//   for (let i = 0; i < paramsArr.length; i++) {
//     const param = paramsArr[i].split("=");
//     debugger
//     const key = decodeURIComponent(param[0]);
//     const value = decodeURIComponent(param[1] || "");
//     if (!value && paramsArr.length == 1) {
//       return paramsString
//     }
//     paramObj[key] = value
//   }
//
//   return JSON.stringify(paramObj);
// }

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
    throw e
  }
}

function getContentCursorOrAll() {
  let parseText
  let oldText
  let isCursor
  const text = contentRefCursorText()
  if (!text) {
    parseText = getActive().content
    oldText = parseText
    isCursor = false
  } else {
    oldText = text
    parseText = text.substring(1, text.length - 1);
    isCursor = true
  }
  return {parseText, oldText, isCursor};
}

const base64Decode = () => {
  let {parseText, oldText, isCursor} = getContentCursorOrAll();

  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const json = getBase64Json(parseText)
    let isJson = false
    try {
      JSON.parse(json)
      isJson = true
    } catch (e) {

    }
    if (json == parseText) {
      contentRefSetFocus()
      return
    }
    if (isCursor && !isJson) {
      replaceNewContent(parseText, json);
    } else {
      replaceNewContent(oldText, json);
    }
    contentRefSetFocus()
  } catch (e) {
  }
}
const getDecode = () => {
  let {parseText, oldText} = getContentCursorOrAll();
  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const paramJson = getParamJson(parseText)
    if (typeof paramJson !== 'object') {
      contentRefSetFocus()
      return
    }

    replaceNewContent(oldText, jsonFormat(paramJson), {
      formatOrder: [supportAutoType.get_param],
      formatOpen: false
    } as formatParam);
    contentRefSetFocus()
  } catch (e) {
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
  let {parseText, oldText} = getContentCursorOrAll();

  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const urlDecode = getUrlDecodeString(parseText)
    replaceNewContent(oldText, urlDecode);
    contentRefSetFocus()
  } catch (e) {
  }
}

function replaceNewContent(oldText?: string, json?: any, formatParam ?: any) {
  let content = getActive().content;
  if (!content) {
  }
  json = typeof json == 'object' ? JSON.stringify(json) : json
  const newContent = content.replace(oldText, json || '')
  if (!newContent || newContent == content) {
  }
  setValue(newContent, formatParam)
}

const getUnSerializeJson = (parseText: string) => {
  try {
    return unserialize(parseText)
  } catch (e) {
    throw e
  }
}
const unserializeDecode = () => {
  let {parseText, oldText} = getContentCursorOrAll();
  if (!parseText) {
    contentRefSetFocus()
    return
  }
  try {
    const json = getUnSerializeJson(parseText)
    if (json == parseText) {
      contentRefSetFocus()
      return
    }
    replaceNewContent(oldText, json);
    contentRefSetFocus()
  } catch (e) {
    contentRefSetFocus()
  }
}

const add = () => {
  const nowTime = new Date().getTime();
  activeKey.value = nowTime;
  panes.value.push({title: dayjs(nowTime).format('HH:mm:ss'), key: nowTime, content: '', time: nowTime});
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

  childElementRefs.value = childElementRefs.value.filter(pane => pane !== targetKey);

};
const getActive = (targetKeyStr?: string | number): any => {
  if (targetKeyStr === undefined) {
    targetKeyStr = activeKey.value
  }
  const targetKey = typeof targetKeyStr === "string" ? parseInt(targetKeyStr) : targetKeyStr
  let restult
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
  contentRefSetFocus();
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
  contentRefSetFocus();
})
const windowCopy = (text: string) => {
  // @ts-ignore
  window.copyContent && window.copyContent(text)
}

const format = () => {
  const text = contentRefCopy()
  setValue(text)
  contentRefSetFocus()
}
// const copy = () => {
//   const text = contentRefCopy()
//   windowCopy(text)
// }
const archiveCopy = () => {
  const text = contentRefCopy()
  try {
    const archiveText = jsonArchive(text)
    windowCopy(archiveText)
  } catch (e) {
  }
  contentRefSetFocus()
}
const formDataCopy = () => {
  const text = contentRefCopy()
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
  contentRefSetFocus()
}

const handleConfigMenuClick = (clickInfo: any) => {
  switch (clickInfo.key) {
    case "useWrap":
      contentConfig.useWrap = !contentConfig.useWrap;
      break;
    case "switchCode":
      if (getActive().content || panes.value.length > 1) {
        message.error('有数据无法切换');
        return
      }
      const nextCodeTemplete: any = {
        code: 'moncaco',
        moncaco: 'code'
      };
      useCodeTemplate.value = nextCodeTemplete[useCodeTemplate.value]
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

        <CodeTemplate v-if="useCodeTemplate == 'code'" style="height: 100%;width: 100%;" :ref="getContentRef(pane.key)"
                      :config="contentConfig"
                      @onChange="onChange"></CodeTemplate>
        <MonacoTemplate v-if="useCodeTemplate == 'moncaco'" style="height: 100%;width: 100%;"
                        :ref="getContentRef(pane.key)" :config="contentConfig"
                        @onChange="onChange"></MonacoTemplate>
      </a-tab-pane>
    </a-tabs>

    <a-space wrap style="justify-content: end;margin: 2px;">
      <a-button @click="format">格式化</a-button>
      <a-button @click="pasteOnly">仅粘贴</a-button>
      <!--      <a-button @click="paste">粘贴</a-button>-->
      <!--      <a-button @click="copy">复制</a-button>-->
      <a-button @click="archiveCopy">复制压缩</a-button>
      <a-button @click="formDataCopy">复制form</a-button>
      <!--      <a-button @click="escape">去除转义</a-button>-->
      <!--      <a-button @click="escapeCursor">光标处去转义</a-button>-->
      <!--      <a-button @click="showModal">历史</a-button>-->
      <a-button @click="getDecode">get参数</a-button>
      <a-button @click="urlDecode">url_decode</a-button>
      <a-button @click="base64Decode">base64_decode</a-button>
      <a-button @click="unserializeDecode">unserialize</a-button>


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

:deep(.ant-space-item) {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
  margin-right: 4px !important;
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

.dark{
  background: #303133;
}
</style>
