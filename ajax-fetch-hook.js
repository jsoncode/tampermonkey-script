// ==UserScript==
// @name         油猴拦截接口请求
// @namespace    http://tampermonkey.net/
// @version      2024-06-21
// @description  try to take over the world!
// @author       You
// @match        *://**/**
// @grant        none
// ==/UserScript==
window.addEventListener('message', function (e) {
    if (e.data.type?.startsWith('proxy_')) {
        let res = e.data?.data?.res
        let args = e.data?.data?.args;
        try{
            console.log(JSON.parse(args),JSON.parse(res))
        }catch(e){
            console.log(e)
        }
    }
});
(function (xhr) {

    var XHR = XMLHttpRequest.prototype;

    var open = XHR.open;
    var send = XHR.send;

    XHR.open = function (method, url) {
        this._method = method;
        this._url = url;
        return open.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            window.postMessage({ type: 'proxy_xhr', data: this.response }, '*');  // 将响应发送到 content script
        });
        return send.apply(this, arguments);
    };
})(XMLHttpRequest);
(function () {
    let origFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await origFetch(...args);
        response
            .clone()
            .text() // 此处需要根据不同数据调用不同方法，这里演示的是二进制大文件，比如音频
            .then(data => {
            // 对于二进制大文件可以创建为URL(blob:开头)，供其它脚本访问
            //sessionStorage['wave'] = URL.createObjectURL(data); // 插件需要添加'storage'权限
            window.postMessage({ type: 'proxy_fetch', data: { res: data, args: JSON.stringify({ ...args }) } }, '*'); // send to content script
        })
            .catch(err => console.error(err));
        return response;
    }
})();
