<script setup lang="ts">import {reactive, ref, watch} from 'vue';
import dayjs from 'dayjs'
import CodeTemplate from "./CodeTemplate.vue";
import utf8 from "utf8";
import {config} from "../interface";
import {DownOutlined, LockOutlined, UnlockOutlined} from '@ant-design/icons-vue';
import {unserialize} from 'serialize-php';

const props = defineProps<{ theme: string }>()
const childElementRefs = ref([]);

const contentConfig = reactive<config>({
  fontSize: '14px',
  printMargin: false,
  useWrap: false,
  theme: props.theme
})
// @ts-ignore
window.onPluginEnter && window.onPluginEnter(({payload, type}: any) => {
  // console.info('in', payload, type);
  if (type == 'regex') {
    activeKey.value = 0
    setValue(payload);
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
const getFormatData = (str: string) => {
  try {
    str = getJson(str)
    console.info('f:json')
  } catch (e) {
    try {
      str = unicodeString(str)
      str = utf8String(str)
      str = getJson(str)
      console.info('f:unicode utf8')
    } catch (e) {
      const paramJson = getParamJson(str)
      if (paramJson != str && typeof paramJson === 'object' && JSON.stringify(paramJson) != '{}') {
        str = jsonFormat(paramJson)
        console.info('f:param')
      }
    }
  }
  return str;
}
// const utf8Verify = (str: string) => {
//   const regex = /^.*(?:\\x[a-f0-9]{2})+.*$/
//   if (!regex.test(str)) {
//     return false
//   }
//   return true
// }
const unicodeString = (str: string) => {
  return eval("'" + str + "'")
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
const getJson = (str: string) => {
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
  return JSON.stringify(str, null, 2)
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

const setValue = (str?: string) => {
  str = str === undefined ? '' : str
  str = getFormatData(str);
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
const getParamJson = (paramsString: string) => {
  const paramObj: any = {};
  const queryString = paramsString.replace(/^[^?]*\?/, '');
  const paramsArr = queryString.split("&");

  for (let i = 0; i < paramsArr.length; i++) {
    const param = paramsArr[i].split("=", 2);
    const key = decodeURIComponent(param[0]);
    const value = decodeURIComponent(param[1] || "");
    if (!value && paramsArr.length == 1) {
      return paramsString
    }
    paramObj[key] = value
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
  const text = contentRefCursorText()
  if (!text) {
    parseText = getActive().content
    oldText = parseText
  } else {
    oldText = text
    parseText = text.substring(1, text.length - 1);
  }
  return {parseText, oldText};
}

const base64Decode = () => {
  let {parseText, oldText} = getContentCursorOrAll();

  if (!parseText) {
    return
  }
  try {
    const json = getBase64Json(parseText)
    try {
      JSON.parse(json)
    } catch (e) {
      return
    }
    replaceNewContent(oldText, json);
    contentRefSetFocus()
  } catch (e) {
  }
}

function replaceNewContent(oldText?: string, json?: any) {
  let content = getActive().content;
  if (!content) {
  }
  json = typeof json == 'object' ? JSON.stringify(json) : json
  const newContent = content.replace(oldText, json || '')
  if (!newContent || newContent == content) {
  }
  setValue(newContent)
}

const unserializeDecode = () => {
  let {parseText, oldText} = getContentCursorOrAll();
  if (!parseText) {
    return
  }
  try {
    const json = unserialize(parseText)
    replaceNewContent(oldText, json);
    contentRefSetFocus()
  } catch (e) {

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
}
const copy = () => {
  const text = contentRefCopy()
  windowCopy(text)
}
const archiveCopy = () => {
  const text = contentRefCopy()
  try {
    const archiveText = jsonArchive(text)
    windowCopy(archiveText)
  } catch (e) {
  }
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
  }
}
</script>

<template>
  <div :class="`container ` + props.theme">
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
      </template>
      <a-tab-pane v-for="pane in panes" :key="pane.key" :tab="pane.title" :closable="pane.closable || !pane.favorite"
                  style="height: 100%;width: 100%;">

        <CodeTemplate style="height: 100%;width: 100%;" :ref="getContentRef(pane.key)" :config="contentConfig"
                      @onChange="onChange"></CodeTemplate>
      </a-tab-pane>
    </a-tabs>

    <a-space wrap style="justify-content: end;margin: 2px;">
      <a-button @click="format">格式化</a-button>
      <a-button @click="pasteOnly">仅粘贴</a-button>
      <!--      <a-button @click="paste">粘贴</a-button>-->
      <a-button @click="copy">复制</a-button>
      <a-button @click="archiveCopy">复制压缩</a-button>
      <!--      <a-button @click="escape">去除转义</a-button>-->
      <!--      <a-button @click="escapeCursor">光标处去转义</a-button>-->
      <!--      <a-button @click="showModal">历史</a-button>-->
      <a-button @click="base64Decode">base64</a-button>
      <a-button @click="unserializeDecode">unserialize</a-button>

      <a-dropdown placement="top">
        <a-button>配置(暂未落盘)</a-button>
        <template #overlay>
          <a-menu @click="handleConfigMenuClick">
            <a-menu-item key="useWrap">
              切换换行
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>

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
}

:deep(.ant-space-item) {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
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
</style>
