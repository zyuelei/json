<script setup lang="ts">

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {reactive, toRefs, watchEffect} from "vue";
import {config} from "../interface";

const editorDiv = ref();
const editorInit = ref()
let editor: any;


(self as any).MonacoEnvironment = {
  // @ts-ignore
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}


const emit = defineEmits(['onChange'])
const props = defineProps<{ config: config }>()
const propsRle = reactive(props)
const propsRef = toRefs<{ config: config }>(propsRle)
watchEffect(() => {
  if (editorInit.value) {
    let newConfig: any = {}
    typeof propsRef.config.value.fontSize == 'number' ? newConfig.fontSize = propsRef.config.value.fontSize : '' // 设置文字大小
    typeof propsRef.config.value.useWrap == 'boolean' ? (newConfig.wordWrap = propsRef.config.value.useWrap ? 'on' : 'off') : '' // 是否换行
    typeof propsRef.config.value.tabSize == 'number' ? (newConfig.tabSize = propsRef.config.value.tabSize) : '' // 制表符长度
    // typeof propsRef.config.value.printMargin == 'boolean' && editor.setShowPrintMargin(propsRef.config.value.printMargin) // 打印边距可见
    propsRef.config.value.theme == 'dark' && monaco.editor.setTheme('vs-dark') // 设置主题
    editor.updateOptions(newConfig);
  }
})

const handleResize = () => {
  if (editor) {
    editor.layout();
  }
};

const init = () => {
  editor = monaco.editor.create(editorDiv.value, {
    minimap: {enabled: false},
    value: "",
    suggestOnTriggerCharacters: false,
    language: 'json'
  })

  editor.onDidChangeModelContent(() => {
    const content = editor.getValue() // 给父组件实时返回最新文本
    // console.info(value,i,v)
    emit('onChange', {content, format: false});
  })

  editor.onDidPaste(() => {
    // 处理粘贴事件
    const content = editor.getValue() // 给父组件实时返回最新文本
    emit('onChange', {content: content, format: true});
  });

  window.addEventListener('resize', handleResize);
}


const setVal = (str: string) => {
  let content = editor.getValue()
  if (content == str) {
    return
  }
  // editor.setValue(str)
  // 使用 executeEdits 方法设置编辑器内容，并记录到撤销历史
  editor.pushUndoStop()
  editor.executeEdits('setValue', [
    {
      range: editor.getModel().getFullModelRange(),
      text: str,
      forceMoveMarkers: true
    }
  ]);
  editor.pushUndoStop()

  // const lineCount = editor.getModel().getLineCount();
  // const lastLineLength = editor.getModel().getLineLength(lineCount);
  // editor.revealLine(lineCount);
  // editor.setPosition({
  //   lineNumber: lineCount,
  //   column: lastLineLength + 1,
  // });
  editor.setScrollPosition({scrollLeft: 0});
}
const focus = () => {
  editor.focus()
}
const copy = () => {
  // 获取选中的范围
  const selectionRange = editor.getSelection();
  // 获取选中的文本
  const selectedText = editor.getModel().getValueInRange(selectionRange);
  if (selectedText) {
    return selectedText;
  } else {
    return editor.getValue()
  }

}

const insert = (text: string) => {
  // editor.trigger('keyboard', 'type', {text: text});
  const selection = editor.getSelection();
  // const id = {major: new Date().getTime(), minor: new Date().getTime()};
  const id = {major: 1, minor: 1};
  var op = {identifier: id, range: selection, text: text, forceMoveMarkers: true};
  editor.pushUndoStop()
  editor.executeEdits("my-source", [op]);
  editor.pushUndoStop()
}


const cursorText = () => {
  const cursorPosition = editor.getSelection().getStartPosition();
  const token = editor.getModel().getLineContent(cursorPosition.lineNumber);
  const search = findString(token, cursorPosition.column)

  function findString(str: string, i: number) {
    let startIndex = -1;
    let endIndex = -1;
    if (i <= 0) {
      return null
    }

    // 从指定位置i往前搜索起始双引号
    for (let j = i; j >= 0; j--) {
      if (str[j] === '"' && str[j - 1] !== '\\') {
        startIndex = j;
        break;
      }
    }

    // 从指定位置i往后搜索结束双引号
    for (let j = i; j < str.length; j++) {
      if (str[j] === '"' && str[j - 1] !== '\\') {
        endIndex = j;
        break;
      }
    }

    // 提取被双引号包裹的字符串
    if (endIndex !== -1 && endIndex >= startIndex) {
      return str.slice(startIndex, endIndex + 1);
    }

    return null; // 没有找到对应的字符串
  }

  return search;
}
onMounted(() => {
  init()
  editorInit.value = true
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  editor?.dispose();
  editorDiv.value = null;
  editor = null
});
defineExpose({setVal, focus, copy, insert, cursorText})
</script>

<template>
  <div ref="editorDiv" style="width: 100%;height: 100%;min-height: 100px"></div>

</template>

<style scoped>
.ace_dark {
}
</style>
