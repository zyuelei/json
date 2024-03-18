<script setup lang="ts">

import * as monaco from 'monaco-editor'
// @ts-ignore
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// @ts-ignore
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import {onBeforeUnmount, onMounted, ref} from "vue";
import {editContentMy, rangeMy} from "../interface";
import {useSetConfigDetector} from "../tools/detector";
import IDimension = monaco.editor.IDimension;

const editorDiv = ref();
const editorInit = ref(false)
let editor: any;


(self as any).MonacoEnvironment = {
  // @ts-ignore
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    // if (label === 'css' || label === 'scss' || label === 'less') {
    //   return new cssWorker()
    // }
    // if (label === 'html' || label === 'handlebars' || label === 'razor') {
    //   return new htmlWorker()
    // }
    // if (label === 'typescript' || label === 'javascript') {
    //   return new tsWorker()
    // }
    return new editorWorker()
  }
}

const emit = defineEmits(['onInit', 'onChange', 'format'])

const afterInit = () => {
  if (!editorInit.value) {
    return
  }
  let newConfig: any = {}
  typeof getConfig('fontSize') == 'number' ? newConfig.fontSize = getConfig('fontSize') : '' // 设置文字大小
  typeof getConfig('useWrap') == 'boolean' ? (newConfig.wordWrap = getConfig('useWrap') ? 'on' : 'off') : '' // 是否换行
  typeof getConfig('tabSize') == 'number' ? (newConfig.tabSize = getConfig('tabSize')) : '' // 制表符长度
  // typeof getConfig'rintMargin. == 'boolean' && editor.setShowPrintMargin(getConfig'rintMargin.) // 打印边距可见
  getConfig('theme') == 'dark' ? monaco.editor.setTheme('vs-dark') : monaco.editor.setTheme('vs') // 设置主题
  editor.updateOptions(newConfig);
}
const {getConfig, unConfigChange} = useSetConfigDetector({
  onConfigChange: afterInit
})

const resize = (dimension: IDimension) => {
  if (editor) {
    editor.layout(dimension);
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
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
        emit('format');
      }
  );
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, function () {
        emit('format');
      }
  );

  emit('onInit', {});
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
const replace = (range: monaco.IRange, newText: string) => {
  editor.pushUndoStop()
  editor.getModel().pushEditOperations(
      [],
      [{
        range,
        text: newText,
        forceMoveMarkers: true
      }]
  );
  editor.pushUndoStop()
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
  afterInit();
})

onBeforeUnmount(() => {
  // window.removeEventListener('resize', handleResize);
  editor?.dispose();
  editorDiv.value = null;
  editor = null
  unConfigChange(afterInit)
});
defineExpose({setVal, focus, copy, insert, replace, toRange, getContentInfo, resize})
</script>

<template>
  <div class="monacoContainer">
    <div ref="editorDiv"></div>
  </div>

</template>

<style scoped>
.monacoContainer {
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
}

.monacoContainer div {
  height: 100%;
  width: 100%;
}
</style>
