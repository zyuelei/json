<script setup lang="ts">

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import {onBeforeUnmount, onMounted, ref} from "vue";
import {reactive, toRefs, watchEffect} from "vue";
import {config, editContentMy, rangeMy} from "../interface";
import {IRange} from "monaco-editor";

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
    propsRef.config.value.theme == 'dark' ? monaco.editor.setTheme('vs-dark') : monaco.editor.setTheme('vs') // 设置主题
    editor.updateOptions(newConfig);
  }
})

const handleResize = () => {
  if (editor) {
    editor.layout();
  }
};
// const cursorLastPosition = ref({
//   lineNumber: 1,
//   column: 1
// })
const init = () => {
  editor = monaco.editor.create(editorDiv.value, {
    minimap: {enabled: false},
    value: "",
    suggestOnTriggerCharacters: false,
    language: 'json',
  })
  editor.getModel().setEOL(monaco.editor.EndOfLineSequence)

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

  // editor.onDidChangeCursorPosition(event => {
  //   const position = event.position;
  //   const lineNumber = position.lineNumber;
  //   const column = position.column;
  //   cursorLastPosition.value.lineNumber = position.lineNumber;
  //   cursorLastPosition.value.column = position.column;
  //   console.log("c:", lineNumber, column);
  // });

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

const getContentInfo = (): editContentMy => {
  const model = editor.getModel();

  // 获取最后一行和最后一列的值
  const lastLine = model.getLineCount();
  const lastColumn = model.getLineMaxColumn(lastLine);

  const selectionRange = editor.getSelection();
  return {
    startLine: selectionRange.startLineNumber,
    endLine: selectionRange.endLineNumber,
    startColumn: selectionRange.startColumn,
    endColumn: selectionRange.endColumn,
    positionLine: selectionRange.positionLineNumber,
    positionColumn: selectionRange.positionColumn,
    lastLine: lastLine,
    lastColumn: lastColumn,
    firstLine: 1,
    firstColumn: 1,
  }
}
const toRange = ({startLine, endLine, startColumn, endColumn}: rangeMy) => {
  return {
    startLineNumber: startLine,
    startColumn: startColumn,
    endLineNumber: endLine,
    endColumn: endColumn,
  }
}
const replace = (range: IRange, newText: string) => {
  editor.getModel().pushEditOperations(
      [],
      [{
        range,
        text: newText,
        forceMoveMarkers: true
      }]
  );
  editor.setScrollPosition({scrollLeft: 0});
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
defineExpose({setVal, focus, copy, insert, replace, toRange, getContentInfo})
</script>

<template>
  <div ref="editorDiv" style="width: 100%;height: 100%;min-height: 100px"></div>

</template>

<style scoped>
.ace_dark {
}
</style>
