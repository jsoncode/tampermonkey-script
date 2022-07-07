// ==UserScript==
// @name         在react/vue/angular页面中,在输入框内,模拟输入内容
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://**/**
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(()=>{
        find('.antd-pro-app-src-pages-auth-login-index-tabs span:last-child').click()
        inputValue(find('#phone'),'12312312313');
        inputValue(find('#checkCode'),'1234');
    },1000)

  // 核心代码
    function inputValue(el, value) {
        const prop = HTMLInputElement.prototype;
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setValue.call(el, value);
        const event = new Event('input', { bubbles: true });
        el.dispatchEvent(event);
    }
    function find(selector) {
        return document.querySelector(selector);
    }
})();
