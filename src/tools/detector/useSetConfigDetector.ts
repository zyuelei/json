import {reactive, toRaw} from "vue";
import {
    configListenerInterface,
    nativeConfigInterface,
    supportAutoType,
    supportEditTemplateType,
    systemConfigInterface
} from "../../interface";
import {windowGetContent, windowGetNativeId, windowSetContent} from "../windowTool.ts";

interface useSetConfigDetectorParam {
    onConfigChange?: configListenerInterface;
}

const systemConfig = windowGetContent('config');
const config: systemConfigInterface = systemConfig ? systemConfig : {
    fontSize: 14,
    tabSize: 4,
    printMargin: false,
    useWrap: false,
    autoFormat: [supportAutoType.extractJson, supportAutoType.archive, supportAutoType.multiEscape],
    render: supportEditTemplateType.monaco, // brace  moncaco
    defaultNewTab: true,
    doubleShiftKeyDown: false,
    saveData: true,
    stickyEnable: true,
};
const contentConfig = reactive<systemConfigInterface>(config)
const callbackList: configListenerInterface[] = [];

let nativeConfig: any;
let nativeKey = ''

function initNativeConfig() {
    nativeKey = 'config_native/' + windowGetNativeId();
    const windowNativeConfig = windowGetContent(nativeKey);
    const loadNativeConfig: nativeConfigInterface = windowNativeConfig ? windowNativeConfig : {
        recoverDir: ''
    }
    nativeConfig = reactive<nativeConfigInterface>(loadNativeConfig)
}

setTimeout(initNativeConfig, 200)
// 取消注册观察者
const unConfigChange = (observer: configListenerInterface) => {
    const index = callbackList.indexOf(observer);
    if (index !== -1) {
        callbackList.splice(index, 1);
    }
}

const getConfig = <T extends keyof systemConfigInterface>(key: T): systemConfigInterface[T] => {
    return contentConfig[key];
}
const setConfig = <T extends keyof systemConfigInterface>(key: T, value: systemConfigInterface[T]) => {
    contentConfig[key] = value;
    windowSetContent('config', toRaw(contentConfig))
    callbackList.map(callback => callback(key, value))
}

export function useSetConfigDetector({
                                         onConfigChange
                                     }: useSetConfigDetectorParam
) {

    if (onConfigChange) {
        callbackList.push(onConfigChange)
    }

    // watch(contentConfig, () => {
    //     windowSetContent('config', toRaw(contentConfig))
    // }, {
    //     deep: true
    // });

    const getNativeConfig = <T extends keyof nativeConfigInterface>(key: T): nativeConfigInterface[T] => {
        return nativeConfig[key]
    }

    const setNativeConfig = <T extends keyof nativeConfigInterface>(key: T, value: nativeConfigInterface[T]) => {
        nativeConfig[key] = value;
        windowSetContent(nativeKey, toRaw(nativeConfig))
    }

    return {getConfig, setConfig, unConfigChange, getNativeConfig, setNativeConfig};
}
