import {reactive, toRaw} from "vue";
import {
    configListenerInterface,
    supportAutoType,
    supportEditTemplateType,
    systemConfigInterface
} from "../../interface";
import {windowGetContent, windowSetContent} from "../windowTool.ts";

interface useSetConfigDetectorParam {
    onConfigChange?: configListenerInterface;
}

const systemConfig = windowGetContent('config');
const config: systemConfigInterface = systemConfig ? systemConfig : {
    fontSize: 14,
    tabSize: 4,
    printMargin: false,
    useWrap: false,
    autoFormat: [supportAutoType.extractJson, supportAutoType.archive],
    render: supportEditTemplateType.monaco, // brace  moncaco
    defaultNewTab: false,
    doubleShiftKeyDown: false,
    saveData: false,
};
const contentConfig = reactive<systemConfigInterface>(config)
const callbackList: configListenerInterface[] = [];

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

    return {getConfig, setConfig, unConfigChange};
}
