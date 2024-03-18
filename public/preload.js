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
    }, () => {
        setTimeout(() => {
            callback && callback({payload: '', type: 'string', code: 'json_format'})
        });
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

window.setContent = (key, value) => {
    return toolsFun(() => {
        utools.dbStorage.setItem(key, value)
    }, () => {
        localStorage.setItem(key, JSON.stringify(value));
    })
}

window.getContent = (key) => {
    return toolsFun(() => {
        return utools.dbStorage.getItem(key)
    }, () => {
        return JSON.parse(localStorage.getItem(key));
    })
}

window.removeContent = (key) => {
    return toolsFun(() => {
        utools.dbStorage.removeItem(key)
    }, () => {
        localStorage.removeItem(key);
    })
}

window.allContent = (prefix) => {
    return toolsFun(() => {
        return utools.db.allDocs(prefix)
    }, () => {
        const matchingData = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!prefix || key.startsWith(prefix)) {
                const value = localStorage.getItem(key);
                matchingData.push({
                    _id: key,
                    value: JSON.parse(value)
                });
            }
        }

        return matchingData;
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