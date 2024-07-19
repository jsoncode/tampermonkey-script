// ==UserScript==
// @name         禅道插件-新建提测单
// @namespace    http://tampermonkey.net/
// @version      2024-06-21
// @description  欢迎使用油猴脚本
// @match        https://kpwork.otosaas.com/zentao/testtask-create-**.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=otosaas.com
// @grant        none
// ==/UserScript==

(function() {
    const time = new Date()
    const date = time.getFullYear()+'/'+(time.getMonth()+1)+'/'+time.getDate();
    const html = `<div><h1 style="text-align:center;">提测单</h1><p>&ZeroWidthSpace;<br></p><p><table class="table table-kindeditor ke-select-col" style="width:100%;"><tbody><tr><td style="border:1px solid #ddd;" class="">1. 项目名称<br></td><td style="border:1px solid #ddd;">xxx<br></td><td style="border:1px solid #ddd;" class="" rowspan="10" colspan="1"><p>前端：xxx</p><p>后端：xxx</p></td></tr><tr><td style="border:1px solid #ddd;" class="">2. 提测人</td><td style="border:1px solid #ddd;">xxx<br></td></tr><tr><td style="border:1px solid #ddd;" class="">3. 提测时间</td><td style="border:1px solid #ddd;">${date}<br></td></tr><tr><td style="border:1px solid #ddd;" class="">4. 开发自测通过功能列表</td><td style="border:1px solid #ddd;"><p>1.&nbsp;功能/页面11</p><p>2. 功能/页面22</p></td></tr><tr><td style="border:1px solid #ddd;" class="">5. 测试地址</td><td style="border:1px solid #ddd;">&ZeroWidthSpace;url<br></td></tr><tr><td style="border:1px solid #ddd;" class="">6. pro文档</td><td style="border:1px solid #ddd;">&ZeroWidthSpace;墨刀链接<br></td></tr><tr><td style="border:1px solid #ddd;" class="">7. 需求文档</td><td style="border:1px solid #ddd;">&ZeroWidthSpace;禅道需求链接<br></td></tr><tr><td style="border:1px solid #ddd;" class="">8. UI地址</td><td style="border:1px solid #ddd;"><br></td></tr><tr><td style="border:1px solid #ddd;" class="">9. 影响范围</td><td style="border:1px solid #ddd;"><br></td></tr><tr><td style="border:1px solid #ddd;" class="">10. 计划上线时间</td><td style="border:1px solid #ddd;"><br></td></tr></tbody></table></p><p><br/></p></div>`
    const iframe = document.querySelector('.ke-edit-iframe')
    if(iframe){
        iframe.contentDocument.body.innerHTML = html;
        setTimeout(()=>{
            iframe.style.height = '520px';
            iframe.parentElement.style.height = '520px';
            iframe.nextElementSibling.style.height = '520px';
            document.querySelector('#dataform tbody tr:nth-child(8) th').addEventListener('click',()=>{
                navigator.clipboard.writeText(html)
            },false)
        },1000)
    }
})();
