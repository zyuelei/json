window.copyContent = (text) => {
    toolsFun(() => {
        utools.copyText(text)
    }, () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(function () {
                })
                .catch(function (error) {
                });
        }
    })
}
window.getClipboardContent = (callback, errCallback) => {
    if (navigator.clipboard) {
        navigator.clipboard.readText()
            .then(text => callback(text))
            .catch(error => errCallback(error));
    } else {
        errCallback('当前浏览器不支持Clipboard API');
    }
}

window.onPluginEnter = (callback) => {
    toolsFun(() => {
        utools.onPluginEnter((option) => {
            callback && callback(option)
        })
    })
}

window.isDark = () => {
    return toolsFun(() => {
        return utools.isDarkColors()
    }, () => {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
    })
}

const toolsFun = (callback, errCallback) => {
    if (typeof utools != 'undefined') {
        return callback();
    } else {
        return errCallback && errCallback()
    }
}

window.isMacOS = () => {
    return toolsFun(() => {
        return utools.isMacOS()
    }, () => {
        return getOperatingSystem() === 'MacOs'
    })
}

function getOperatingSystem() {
    var os = "Unknown OS";
    if (navigator.appVersion.indexOf("Win") !== -1) os = "Windows";
    if (navigator.appVersion.indexOf("Mac") !== -1) os = "MacOs";
    if (navigator.appVersion.indexOf("X11") !== -1) os = "UNIX";
    if (navigator.appVersion.indexOf("Linux") !== -1) os = "Linux";
    return os;
}