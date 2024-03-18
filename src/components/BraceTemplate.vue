<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'

import * as ace from 'brace';
import 'brace/ext/searchbox';
import 'brace/ext/language_tools';
import 'brace/mode/json';
import 'brace/theme/monokai';
import {editContentMy, rangeMy} from "../interface";
import {useSetConfigDetector} from "../tools/detector";

const editorDiv = ref();
const editor = ref();

const afterInit = () => {
  if (!editor.value) {
    return
  }

  typeof getConfig('fontSize') == 'number' && editor.value.setFontSize(getConfig('fontSize') + 'px') // 设置文字大小
  typeof getConfig('useWrap') == 'boolean' && editor.value.getSession().setUseWrapMode(getConfig('useWrap')) // 是否换行
  typeof getConfig('tabSize') == 'number' && editor.value.getSession().setTabSize(getConfig('tabSize')) // 制表符长度
  typeof getConfig('printMargin') == 'boolean' && editor.value.setShowPrintMargin(getConfig('printMargin')) // 打印边距可见
  getConfig('theme') == 'dark' ? editor.value.setTheme('ace/theme/monokai') : editor.value.setTheme('ace/theme/textmate') // 设置主题
}

const {getConfig, unConfigChange} = useSetConfigDetector({
  onConfigChange: afterInit
})

const emit = defineEmits(['onInit', 'onChange', 'format'])

const showEdit = (editorDiv: any) => {
  editor.value = ace.edit(editorDiv);
  editor.value.getSession().setMode('ace/mode/json');
  editor.value.$blockScrolling = Infinity

  editor.value.on('paste', function () {
    setTimeout(() => {
      let content = editor.value.getValue()
      emit('onChange', {content: content, format: true});
    }, 5)
  })
  editor.value.on('change', function () {
    let content = editor.value.getValue()
    emit('onChange', {content, format: false});
  })
  editor.value.commands.bindKey("Alt-0", null);

// 获取折叠行的数据
//   function getFoldedLines() {
//     const session = editor.value.getSession();
//     const length = session.getLength();
//     const foldedLines = [];
//
//     for (let row = 0; row < length; row++) {
//       const fold = session.getFoldAt(row, 1);
//
//       if (fold) {
//         const foldRange = fold.range;
//         const start = foldRange.start.row;
//         const end = foldRange.end.row;
//
//         foldedLines.push({start, end});
//         row = end;  // 跳过已折叠的行
//       }
//     }
//
//     return foldedLines;
//   }

// // 显示折叠行数
//   function showFoldedLines() {
//     const foldedLines = getFoldedLines();
//
//     console.log('折叠行数：');
//     foldedLines.forEach((foldedLine) => {
//       console.log(`起始行：${foldedLine.start}，结束行：${foldedLine.end}`);
//     });
//   }
//
// // 监听折叠相关事件
//   editor.value.getSession().on('fold', () => {
//     showFoldedLines();
//   });
//
//   editor.value.getSession().on('unfold', () => {
//     showFoldedLines();
//   });
//
//   editor.value.getSession().on('changeFold', () => {
//     showFoldedLines();
//   });
//

}
const setVal = (str: string) => {
  let content = editor.value.getValue()
  if (content == str) {
    return
  }
  editor.value.setValue(str, 1)
  editor.value.session.setScrollLeft(0)
}
const focus = () => {
  editor.value.focus()
  editor.value.resize()
}
// const copy = () => {
//
//   const copyContent = editor.value.getCopyText();
//   if (copyContent) {
//     return copyContent;
//   } else {
//     return editor.value.getValue()
//   }
//
// }

// const getByteCount = (str: string) => {
//   const encoder = new TextEncoder();
//   const byteArray = encoder.encode(str);
//   return byteArray.length;
// }

// const cursorText = () => {
//   const session = editor.value.getSession();
//   const cursorPosition = editor.value.getCursorPosition();
//   const token = session.getTokens(cursorPosition.row);
//
//   let startType = 'start'
//   let startIndex = -1
//   let endIndex = -1
//   let hasIndex = 0
//   let result: any[] = []
//   token.map((value: any, index: number) => {
//     if (value.value && value.type == 'string' && startType == 'start') {
//       if ('"' === value.value.charAt(0)) {
//         startIndex = index
//       }
//     }
//     hasIndex += value.value.length
//     if (cursorPosition.column < hasIndex) {
//       startType = 'end'
//     }
//     if (value.value && value.type == 'string' && startType == 'end') {
//       if ('"' === value.value.charAt(value.value.length - 1)) {
//         endIndex = index
//         return;
//       }
//     }
//   })
//   if (endIndex >= startIndex && endIndex > -1) {
//     token.map((value: any, index: number) => {
//       if (index >= startIndex && index <= endIndex) {
//         result.push(value.value)
//       }
//     })
//   }
//   let resultStr = ''
//   if (result) {
//     resultStr = result.join('')
//   }
//   return resultStr
//
// }

const insert = (text: string) => {
  editor.value.insert(text)
}

const replace = (range: any, newText: string) => {
  editor.value.getSession().replace(range, newText);
}

const toRange = ({startLine, endLine, startColumn, endColumn}: rangeMy) => {
  return {
    // startRow: startLine - 1,
    // startColumn: startColumn - 1,
    // endRow: endLine - 1,
    // endColumn: endColumn - 1,
    start: {
      row: startLine - 1,
      column: startColumn - 1,
    },
    end: {
      row: endLine - 1,
      column: endColumn - 1,
    }
  }
}
const getContentInfo = (): editContentMy => {
  const session = editor.value.getSession();
  const cursorPosition = editor.value.getCursorPosition();
  const selectionRange = editor.value.getSelectionRange();
  const lastLine = session.getLength()
  const lastLineContent = session.getLine(lastLine - 1);
  const totalColumns = lastLineContent.length;

  return {
    startLine: selectionRange.start.row + 1,
    endLine: selectionRange.start.column + 1,
    startColumn: selectionRange.end.row + 1,
    endColumn: selectionRange.end.column + 1,
    positionLine: cursorPosition.row + 1,
    positionColumn: cursorPosition.column + 1,
    lastLine: lastLine + 1,
    lastColumn: totalColumns + 1,
    firstLine: 1,
    firstColumn: 1,
  }
}
const resize = () => {
  // editor.value && editor.value.resize(1)
}
onMounted(() => {
  showEdit(editorDiv.value)
  afterInit()
  emit('onInit', {});
});
onBeforeUnmount(() => {
  editor.value?.destroy();
  editorDiv.value = null;
  editor.value = null
  unConfigChange(afterInit)
});
defineExpose({setVal, focus, insert, replace, toRange, getContentInfo, resize})
</script>

<template>
  <div ref="editorDiv" style="width: 100%;height: 100%;min-height: 100px"></div>
</template>

<style scoped>
.ace_dark {
}
</style>
