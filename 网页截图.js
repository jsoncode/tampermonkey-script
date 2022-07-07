// ==UserScript==
// @name         截图
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  对当前网页进行截图
// @author       You
// @require      https://html2canvas.hertzen.com/dist/html2canvas.js
// @match        **://**/**
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async function() {
    document.addEventListener('dblclick',async()=>{
        console.log('dblclick')
        console.time('down')
        let blob = await getImgBlob();
        downloadFile('test.png',blob)
    })
   async function getImgBlob () {
        return new Promise(resolve => {
            let imgs = Array.from(document.querySelectorAll('img'))
            imgs.forEach(e=>{
                e.setAttribute('crossorigin','anonymous');
                let search = e.src.match(/\?[^\s]*/);
                if(search){
                    search = search[0].replace(/t=[^&\?=]*/,'t='+new Date().getTime())
                }else{
                search = '?t='+new Date().getTime()
                }
                e.setAttribute('src',e.src.replace(/\?[^\s]*/,search))
            })
            html2canvas(document.body,{
                useCORS: true,
                allowTaint: false
            }).then(function (canvas) {
                let imgURL = canvas.toDataURL({format: "image/png", quality: 1});
                resolve(imgURL)
            });
        })
    }
   async function downloadFile (name, blob) {
        let url = '';
        if (typeof blob === 'string' && blob.startsWith('data:')) {
            url = blob;
        } else {
            let data = new Blob([blob]);
            url = URL.createObjectURL(data)
        }
        let dlLink = document.createElement('a');
        dlLink.download = name
        dlLink.href = url;
        dlLink.click();

       console.timeEnd('down')
    }
})();
