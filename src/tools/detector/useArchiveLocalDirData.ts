// 创建文件夹
import {
    windowAddFile,
    windowGetNativeId,
    windowGetPath,
    windowMkdir,
    windowReadDirList,
    windowReadFile,
    windowUnlinkFile
} from "../windowTool.ts";
import {archiveDataInterface, panesInterface} from "../../interface";

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

function formatDate(timestamp: number) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${month}.${day} ${hours}:${minutes.toString().padStart(2, '0')}`;
}

export function useArchiveLocalDirData() {
    function addArchiveLocalDirData(name: string, data: string, callback?: (status: boolean) => void) {
        if (!initStatus) {
            callback && callback(false);
            return false;
        }
        const nowTime = new Date().getTime();
        windowAddFile(globalSavePath + nowTime + '_' + name + '.json', data, (status) => {
            if (!status) {
                callback && callback(false);
                return;
            }
            callback && callback(true);
        })
    }

    const loadArchiveLocalDirData = (callback?: (status: boolean, data: archiveDataInterface[]) => void) => {
        if (!initStatus) {
            callback && callback(false, []);
            return false;
        }
        windowReadDirList(globalSavePath, (status, value) => {
            if (!status) {
                callback && callback(false, [])
                return false;
            }
            let result: archiveDataInterface[] = [];
            value.map((value) => {
                const p = value.split('_', 2)
                const time = parseInt(p[0])
                const formatTime = formatDate(time)
                const name = p[1].replace(/\.json$/, '')
                result.push({
                    key: value,
                    time: time,
                    formatTime: formatTime,
                    name: name,
                    type: 'local'
                })
            })
            result.sort((o, n) => {
                return n.time - o.time
            })
            callback && callback(true, result);
        });
    }

    const recoverArchiveLocalDirData = (key: string, callback: (status: boolean, value: panesInterface[]) => void) => {
        windowReadFile(globalSavePath + key, (status, value) => {
            if (status && value) {
                const parseData: panesInterface[] = JSON.parse(value) || [];
                callback && callback(status, parseData)
            } else {
                callback && callback(false, [])
            }
        });
    };

    const deleteArchiveLocalDirData = (key: string, callback: (status: boolean) => void) => {
        windowUnlinkFile(globalSavePath + key, callback);
    }

    const getArchiveLocalDirSavePath = () => {
        return globalSavePath
    }

    return {
        addArchiveLocalDirData,
        loadArchiveLocalDirData,
        recoverArchiveLocalDirData,
        deleteArchiveLocalDirData,
        getArchiveLocalDirSavePath
    }
}