// ==UserScript==
// @name         油猴中使用Vue3
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       You
// @match        **://**/**
// @require      https://cdn.bootcdn.net/ajax/libs/vue/3.2.37/vue.global.prod.min.js
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function () {
    // 重点, 必须吧vue添加到页面中,才能使用Vue
    unsafeWindow.Vue = Vue
    new Promise(resolve => {
        if (document.getElementById('rootVueApp')) {
            resolve()
        } else {
            const div = document.createElement('div')
            div.id = 'rootVueApp';
            div.style.width = '400px'
            div.style.height = '300px'
            div.style.background = '#fff'
            div.style.boxShadow = ' 0 0 5px rgba(0,0,0,0.2)'
            div.style.position = 'fixed'
            div.style.top = '0'
            div.style.right = '0'
            document.body.appendChild(div)

            setTimeout(() => {
                resolve()
            }, 300)
        }
    }).then(() => {
        const app = Vue.createApp({
            template: `<div>{{message}} <button @click="reverseMessage">reverseMessage</button></div>`,
            data() {
                return {
                    message: 'Hello Vue.js!'
                }
            },
            methods: {
                reverseMessage() {
                    this.message = this.message
                        .split('')
                        .reverse()
                        .join('')
                }
            }
        })
        app.mount('#rootVueApp')
    })
})();
