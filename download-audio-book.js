// ==UserScript==
// @name         有声小说下载
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.tingxiaoshuo.cc/book/**
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    document.title='-----'
    let body = document.body
    body.insertAdjacentHTML('afterbegin',`
        <div style="height:100vh;">
        <iframe src="https://sales-dev.xiaoke.cn/xk/home" style="height:calc(100vh - 50px);width: calc(100% - 20px);display:block;border:0;"></iframe>
        <progress type="range" max="1" min="0" value="0" id="downloadInput"></progress>
        <div id="downloadName"></div>
        </div>
        `)
    let downloadInput = document.querySelector('#downloadInput')
    let downloadName = document.querySelector('#downloadName')
    let playList = Array.from(document.querySelectorAll('#playlist ul li a')).map(item=>{
        let result = item.href.match(/play\/(\d+)\/(\d+)\.html/i);
        if(result){
            return {
                title:'庆余年_'+item.title.replace(/庆余年有声小说 |_庆余年/g,''),
                bookId:result[1],
                chapterId:result[2],

            }
        }
    })
    let downloadIndex = GM_getValue('downloadIndex')*1 || 119;
    run(downloadIndex);
    function run(index){
        let item= playList[index]
        downloadInput.value = 0
        downloadName.innerText = item.title;
        request(item.bookId,item.chapterId).then(res=>{
            let data = JSON.parse(res);
            let url = '';

            if(!data.status){
                alert(data.message);
                return;
            }
            if (data.jsjm==1) {
                url = decodeChar(data.src);
            } else{
                downloadInput.value = 0
                downloadName.innerText = '访问过快，需要等待5分钟';
                setTimeout(()=>{
                    run(GM_getValue('downloadIndex')*1);
                },300*1000)
            };

            return url
        }).then(url=>{
            if(!url){
                return;
            }
            download(url,item.title,e=>{
                downloadInput.value = e.loaded/e.total
            },e=>{
                setTimeout(()=>{
                    index++;
                    GM_setValue('downloadIndex',index);
                    run(index);
                },3000)
            })
        }).catch(e=>{
            alert(e)
        })
    }

    function request(bookId,chapterId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url: `https://www.tingxiaoshuo.cc/pc/index/getchapterurl/bookId/${bookId}/chapterId/${chapterId}.html`,
                onload(res) {
                    resolve(res.responseText);
                },
                onerror(e) {
                    reject(e);
                },
            });
        });
    }
    function download(url,name,progress,success){
        GM_download({
            url,
            name,
            onprogress(e){
                progress && progress(e)
            },
            onload(e){
                success && success(e)
            }
        })
    }
    function decodeChar(u) {
 			var tArr = u.split("*"),
 				str = '';
 			for (var i = 0, n = tArr.length; i < n; i++) {
 				str += String.fromCharCode(tArr[i]);
 			}
 			return str;
 		}
    // Your code here...
})();
