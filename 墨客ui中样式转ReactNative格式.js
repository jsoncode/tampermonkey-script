// ==UserScript==
// @name         墨客ui中样式转ReactNative格式
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  将墨客中的web样式转化成ReactNative的样式
// @author       You
// @match        https://app.mockplus.cn/app/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    document.addEventListener('click', e => {
        setTimeout(e => {
            formatCode(obj => {
                let html = ''
                for (let i in obj) {
                    let item = obj[i]
                    if (typeof item === 'string') {
                        item = `'${item}'`
                    }
                    html += `  ${i}: ${item},\n`
                }
                let tpl = `
                    <div style="display:flex;justify-content:flex-end;padding-top:10px;padding-right:2rem">
                        <a id="copyBtn" style="cursor:pointer;height:24px;padding-left:2rem;padding-right:2rem;;text-align:center;line-height:24px;border-radius: 12px;background: #fff;text-decoration: none;display:inline-block;">
                            复制
                        </a>
                    </div>
                    <div style="display:block;width:100%;overflow:auto;">
                        <textarea id="newStyle" readonly></textarea>
                    </div>
                    <style>
                    #newStyle{height:200px;width:400px;user-select:text;font-size:12px;line-height:20px;background:#181f29;color:rgb(150, 203, 254);padding:1rem;font-family:Consolas, 'Courier New', Courier, monospace}
                    #newStyle::-webkit-scrollbar{background:rgba(255,255,255,.1);height:6px;width:6px;}
                    #newStyle::-webkit-scrollbar-thumb{background:rgba(255,255,255,.3);border-radius:5px;}
                    </style>
                    `
                let newStyle = document.getElementById('newStyle');
                if (!newStyle) {
                    document.querySelector('.property-panel-wrap .c-property-codes').insertAdjacentHTML('afterend', tpl)
                    newStyle = document.getElementById('newStyle');
                    document.getElementById('copyBtn').addEventListener('click', copy, false)
                }
                newStyle.value = html;
                let scrollEl = document.querySelector('.right-panel-container .dsm-c-scrollview>div');
                scrollEl.scrollTop = 600
            })
        }, 200)
    }, false)

    function copy() {
        let newStyle = document.getElementById('newStyle');
        navigator.clipboard.writeText(newStyle.value).then(result => {
            document.getElementById('copyBtn').innerText = '复制成功'
            setTimeout(e => {
                document.getElementById('copyBtn').innerText = '复制'
            }, 1000)
        })
    }

    function formatCode(back) {
        if (/\/specs\/design\//i.test(location.href)) {
            let title = document.querySelector('.platform-toggle-botton-title')
            if (title) {
                title = title.innerText.trim()
                if (/web|h5/i.test(title)) {
                    let code = document.querySelector('.c-property-codes div pre code')
                    if (code) {
                        let obj = {}
                        code = code.innerText.trim()
                        if (code) {
                            code = code.split(/\n/)
                            code = code.forEach(item => {
                                item = item.trim().replace(/;$/, '')
                                item = item.match(/([\w-]+):([\d\w\s#\(\)\.,]+)/)
                                item.shift()
                                item[0] = item[0].replace(/-(\w)/g, function(a, b) {
                                    return b.toUpperCase()
                                })
                                item[1] = item[1].trim()
                                if (/^\d+px$/.test(item[1])) {
                                    // 处理单个带有px的属性
                                    item[1] = item[1].trim().replace(/px/, '') * 1
                                    obj[item[0]] = item[1]
                                } else if (item[0] === 'border') {
                                    // 处理border
                                    item[1] = item[1].match(/([\w\d\.\-]+)\s+([\w\d\.\-]+)\s+([\s\S]+)/).map(attr => attr.trim())
                                    item[1].shift()
                                    item[1][0] = item[1][0].replace(/px/, '') * 1
                                    obj.borderWidth = item[1][0]
                                    obj.borderStyle = item[1][1]
                                    obj.borderColor = item[1][2]
                                } else {
                                    obj[item[0]] = item[1]
                                    if (item[0] === 'padding') {
                                        obj.paddingVertical = item[1]
                                        obj.paddingHorizontal = item[1]
                                        delete obj.padding
                                    } else if (item[0] === 'background' && (!/\(/.test(item[1]) || /rgb/.test(item[1]))) {
                                        obj.backgroundColor = item[1].replace(/,/g, ', ')
                                        delete obj.background
                                    }
                                }
                            })
                        }
                        back(obj)
                    }
                }
            }
        }
    }
})();
