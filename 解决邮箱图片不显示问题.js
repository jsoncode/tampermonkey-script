// ==UserScript==
// @name         解决邮箱图片不显示问题
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://mail.xxx.com/**
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let timer = setInterval(() => {
        let oldIframes = document.querySelectorAll('[data-panel*="read"] .j-mail-content');
        oldIframes.forEach(oldIframe => {
            if (!oldIframe.getAttribute('data-newIframe')) {
                let newIframe = document.createElement('iframe');
                newIframe.setAttribute('data-newIframe', '1')
                // 重点
                newIframe.sandbox = 'allow-same-origin allow-top-navigation allow-scripts'
                newIframe.src = oldIframe.src;
                newIframe.style.width = '100%';
                newIframe.style.border = '0';
                newIframe.classList = oldIframe.classList[0]
                oldIframe.replaceWith(newIframe)
                newIframe.addEventListener('load', e => {
                    Array.from(newIframe.contentDocument.body.querySelectorAll('*')).forEach(item => item.style.maxWidth = '100%')
                    newIframe.style.height = newIframe.contentDocument.body.scrollHeight + 'px';
                    newIframe.parentElement.style.height = newIframe.contentDocument.body.scrollHeight + 'px';
                }, false)
            }
        })
    }, 1000)
})();
