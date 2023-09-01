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

const toolsFun = (callback, errCallback) => {
    if (typeof utools != 'undefined') {
        return callback();
    } else {
        errCallback && errCallback()
    }
}

const isDark = (callback) => {
    return toolsFun((callback) => {
        callback(utools.isDarkColors());
    })
}