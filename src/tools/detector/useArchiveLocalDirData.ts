// 创建文件夹
import {windowAddFile, windowGetNativeId, windowGetPath, windowMkdir} from "../windowTool.ts";

let globalUseDataPath = '';
let globalNativeId = '';
let globalSavePath = '';
let initStatus = false;

function init() {
    if (initStatus) {
        return true;
    }
    const nativeID = globalNativeId || windowGetNativeId();
    const useDataPath = globalUseDataPath || windowGetPath("documents");
    if (!nativeID || !useDataPath) {
        return false;
    }
    globalNativeId = nativeID
    globalUseDataPath = useDataPath + '/'
    globalSavePath = globalUseDataPath + 'json_' + nativeID + '/';
    // 创建文件夹
    windowMkdir(globalSavePath, (status) => {
        if (!status) {
            return;
        }
        initStatus = true
    })
}

setTimeout(init, 100)

export function useArchiveLocalDirData() {
    function addArchiveLocalDirData(name: string, data: string) {
        if (!initStatus) {
            return false;
        }
        const nowTime = new Date().getTime();
        windowAddFile(globalSavePath + nowTime + '_' + name + '.json', data, (status) => {
            if (!status) {
                return;
            }
        })
    }

    return {
        addArchiveLocalDirData
    }
}