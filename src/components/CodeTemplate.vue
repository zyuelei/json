<script setup lang="ts">
import {onMounted, reactive, ref, toRefs, watchEffect} from 'vue'

import * as ace from 'brace';
import 'brace/ext/searchbox';
import 'brace/ext/language_tools';
import 'brace/mode/json';
import 'brace/theme/monokai';
import {config} from "../interface";

const editorDiv = ref();
const editor = ref();


const props = defineProps<{ config: config }>()
const propsRle = reactive(props)
const propsRef = toRefs<{ config: config }>(propsRle)
watchEffect(() => {
  if (editor.value) {
    typeof propsRef.config.value.fontSize == 'string' && editor.value.setFontSize(propsRef.config.value.fontSize) // 设置文字大小
    typeof propsRef.config.value.useWrap == 'boolean' && editor.value.getSession().setUseWrapMode(propsRef.config.value.useWrap) // 是否换行
    typeof propsRef.config.value.tabSize == 'number' && editor.value.getSession().setTabSize(propsRef.config.value.tabSize) // 制表符长度
    typeof propsRef.config.value.printMargin == 'boolean' && editor.value.setShowPrintMargin(propsRef.config.value.printMargin) // 打印边距可见
    propsRef.config.value.theme == 'dark' && editor.value.setTheme('ace/theme/monokai') // 设置主题
  }
})
const emit = defineEmits(['onChange'])

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
}
const copy = () => {

  const copyContent = editor.value.getCopyText();
  if (copyContent) {
    return copyContent;
  } else {
    return editor.value.getValue()
  }

}

const getByteCount = (str: string) => {
  const encoder = new TextEncoder();
  const byteArray = encoder.encode(str);
  return byteArray.length;
}

const cursorText = () => {
  const session = editor.value.getSession();
  const cursorPosition = editor.value.getCursorPosition();
  const token = session.getTokens(cursorPosition.row);

  let startType = 'start'
  let startIndex = 0
  let endIndex = 0
  let hasIndex = 0
  let result: any[] = []
  token.map((value: any, index: number) => {
    if (value.value && value.type == 'string' && startType == 'start') {
      if ('"' === value.value.charAt(0)) {
        startIndex = index
      }
    }
    hasIndex += getByteCount(value.value)
    if (cursorPosition.column < hasIndex) {
      startType = 'end'
    }
    if (value.value && value.type == 'string' && startType == 'end') {
      if ('"' === value.value.charAt(value.value.length - 1)) {
        endIndex = index
        return;
      }
    }
  })
  if (endIndex >= startIndex) {
    token.map((value: any, index: number) => {
      if (index >= startIndex && index <= endIndex) {
        result.push(value.value)
      }
    })
  }
  let resultStr = ''
  if (result) {
    resultStr = result.join('')
  }
  return resultStr

}

const insert = (text: string) => {
  editor.value.insert(text)
}
onMounted(() => {
  showEdit(editorDiv.value)
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
