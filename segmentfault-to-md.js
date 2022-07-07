// ==UserScript==
// @name         思否一键导出到hexo博客
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @require      https://stuk.github.io/jszip/dist/jszip.js
// @require      https://stuk.github.io/jszip-utils/dist/jszip-utils.js
// @require      https://stuk.github.io/jszip/vendor/FileSaver.js
// @author       You
// @match        https://segmentfault.com/u/**/**
// @icon         https://cdn.segmentfault.com/r-19e9153e/touch-icon.png
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// ==/UserScript==

(function () {
    'use strict';
    let zip = new JSZip();
    let bookName = '思否';
    let list = [];
    let button = document.createElement('button');
    button.innerText = '一键导出所有笔记';
    button.classList.add('ant-btn');
    button.classList.add('ant-btn-primary');
    button.id = 'downloadAll';
    button.style.position = 'fixed';
    button.style.right = '50px';
    button.style.top = '70px';
    button.style.height = '40px';
    button.style.paddingLeft = '20px';
    button.style.paddingRight = '20px';
    button.style.border = '0';
    button.style.backgroundColor = '#59a0e1';
    button.style.color = '#fff';
    button.style.fontSize = '16px';
    button.style.zIndex = '9999999';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button)
    //
    document.getElementById('downloadAll').addEventListener('click', e => {
        getList({
            list: [],
        }).then(resList => {
            console.log('内容列表', resList)
            list = resList.list
            loopGet(0)
        })
    }, false);

    function renderCommentItem(item) {
        return `${' '.repeat(item.parent ? 2 : 0)}- ![${item.name}](${item.avatar || 'https://image-static.segmentfault.com/317/931/3179314346-5f61e47221e07'}#avatarimg) [${item.name}](https://segmentfault.com${item.url}) ${localTime(item.created)}回复:${item.parent || ''}\n\n${' '.repeat(item.parent ? 4 : 2)}${item.txt.trim()}\n\n`
    }

    function localTime(time) {
        time = time.toString().length === 10 ? time * 1000 : time
        return new Date(time).toLocaleString().replace(/\//g, '-').replace(/上午|下午|(:\d+$)/g, '')
    }

    function loopGet(index) {
        let listItem = list[index];
        getAnswer(listItem.id).then(answerList => {
            if (answerList.length) {
                return Promise.all(answerList.map(item => getComment(item.id))).then(commentGroup => {
                    commentGroup.forEach((commentList, index) => {
                        answerList[index].commentList = commentList
                    })

                    return answerList
                })
            } else {
                return []
            }
        }).then(answerList => {
            Promise.all([
                getComment(listItem.id),
                getMd(listItem.id)
            ]).then(resList => {
                let anwser = answerList.length ? '\n\n### 网友回答：\n\n' + answerList?.map(item => {
                    let txt = renderCommentItem({
                        name: item.name,
                        avatar: item.avatar.replace(/[#].*/, ''),
                        url: item.url,
                        created: item.time,
                        txt: (item.isUse ? ' **已被采纳** \n\n' : '') + item.content
                    })
                    let subTxt = item.commentList.map(sub => {
                        return renderCommentItem({
                            name: sub.user.name,
                            avatar: sub.user.avatar_url.replace(/[#].*/, ''),
                            url: sub.user.url,
                            created: sub.created,
                            txt: sub.original_text || sub.parsed_text,
                            parent: item.name,
                        })
                    }).join('')
                    return txt + subTxt
                }).join('\n----\n') : '';

                let articleComment = resList[0].length ? '\n\n### 热门评论：\n\n' + resList[0]?.map(item => {
                    let txt = renderCommentItem({
                        name: item.user.name,
                        avatar: item.user.avatar_url.replace(/[#].*/, ''),
                        url: item.user.url,
                        created: item.created,
                        txt: item.original_text || item.parsed_text
                    })
                    let subTxt = item.replies.map(sub => {
                        return renderCommentItem({
                            name: sub.user.name,
                            avatar: sub.user.avatar_url.replace(/[#].*/, ''),
                            url: sub.user.url,
                            created: sub.created,
                            txt: sub.original_text || sub.parsed_text,
                            parent: item.user.name,
                        })
                    }).join('')
                    return txt + subTxt
                }).join('\n----\n') : '';

                let res = resList[1]
                if (typeof res === 'string') {
                    console.log(res)
                    return
                }

                let item = res.filter(item => item.text !== undefined)[0];

                item.md = item.text + articleComment + anwser;

                item.title = item.title.replace(/[/'"\[\]*^$!\s\n@#&+\\?`？:：、，【】’“。.（）()]+/g, '_').replace(/^_+/, '')
                let preMd = `---
uuid: articleId${item.id}
title: ${item.title}
date: ${localTime(item.created)}
categories:
tags: [${item.tags?.map(item => item.name)?.join(',') || ''}]
---

`
                item.md = item.md.replace(/!\[[^\[\]]*]\[([^\[\]]*)]/g, (a, b, c) => {
                    let reg = new RegExp(`\\[${b}\]:\\s*\\(?([^\\[\\]\\(\\)\\s]+)\\)?`, 'i')
                    let img = item.md.match(reg)?.[1];
                    if (img) {
                        return `![image.png](${img})`
                    } else {
                        return a;
                    }
                }).replace(/(\[[^\[\]]*]:\s*\(?([^\[\]()\n]+)\)?\n)+/i, '')
                let files = item.md.match(/!\[[^\[\]]*]\([^()]+\)/ig)?.map(item => item.match(/]\(([^)]+)/i)[1]) || [];
                let imgs = item.md.match(/<img[\s\S]+?src=['"]([^'"]+)['"]/ig)?.map(item => item.match(/<img[\s\S]+?src=['"]([^'"]+)['"]/i)[1]) || []
                files = files.concat(imgs)
                let parentDir = item.parent_uuid ? listMap[item.parent_uuid].dir : zip;
                let mdDir = files.length ? parentDir.folder(item.title) : false
                files = files.filter(item => !/\.svg/.test(item))
                if (files.length) {
                    files = files.map(f => {
                        let newF = f
                        if (!newF.includes('#avatarimg')) {
                            newF = newF.replace(/[#].*/, '')
                        }
                        let mdF = newF.replace(/.*?([^\/()]+)$/, item.title + '/$1')
                        if (!/\.(png|jpg|jpeg|gif|bmp)/.test(mdF)) {
                            mdF += '.png'
                        }
                        item.md = item.md.replace(f, mdF)
                        return newF
                    })
                }
                item.md = item.md.replace(/\s*(style|class)="[^"]*["]/ig, '')

                item.md = preMd + item.md.replace(/​/g, '\n').replace(/ /g, '')

                downloadImages(mdDir, files).then(() => {
                    parentDir.file(item.title + '.md', item.md)
                    console.log('总进度：', (index / list.length * 100).toFixed(2) + '%', item.title)
                    if (index < list.length - 1) {
                        index++;
                        loopGet(index)
                    } else {
                        saveZip()
                    }
                })
            })
        })
    }

    function saveZip() {
        console.log('正在合并文件，并生成zip，开始下载....')
        zip.generateAsync({type: "blob"}).then(function (content) {
            // 下载到本地
            let name = location.href.match(/\/u\/[^\/]+\/([^\/]+)/)?.[1] || ''
            download(bookName + name + '.zip', content);
        });
    }

    async function downloadImages(imgDir, files) {
        if (files && files.length) {
            // 在图片地址后面加上view,可以下载原图
            files = files.map(item => fetchBlob(item.replace(/(\/img\/[a-z\d]+)/i, '$1/view')).then(res => {
                let p = item.match(/[^\/]+$/)[0]
                if (!/\.(png|jpg|jpeg|gif|bmp)/.test(p)) {
                    p += '.png'
                }
                imgDir.file(p, res)
                return item
            }))
            return Promise.all(files)
        } else {
            return new Promise(resolve => resolve())
        }
    }

    function download(name, data) {
        var urlObject = window.URL || window.webkitURL || window;

        var downloadData = new Blob([data]);

        var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
        save_link.href = urlObject.createObjectURL(downloadData);
        save_link.download = name;
        save_link.click();
        console.log('下载完成')
    }


    async function getMd(id) {
        return new Promise((resolve, reject) => {
            let url = `https://segmentfault.com/gateway/revisions?object_id=${id}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'content-type': 'application/json',
                    token: document.cookie.match(/PHPSESSID=([^=&;\s]+)/)[1]
                },
                onload: function (response) {
                    try {
                        resolve(JSON.parse(response.response))
                    } catch (e) {
                        console.log(e)
                        console.log(response)
                    }
                },
                onerror: function (err) {
                    reject(err)
                }
            });
        })
    }

    async function getComment(id) {
        return new Promise((resolve, reject) => {
            let url = `/gateway/comments?query=votes&object_id=${id}&comment_id=&page=1&is_direct=0`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'content-type': 'application/json',
                    token: document.cookie.match(/PHPSESSID=([^=&;\s]+)/)[1]
                },
                onload: function (response) {
                    try {
                        resolve(JSON.parse(response.response).comments)
                    } catch (e) {
                        console.log(e)
                        console.log(response)
                    }
                },
                onerror: function (err) {
                    reject(err)
                }
            });
        })
    }

    async function getAnswer(id) {
        return new Promise((resolve, reject) => {
            if (!/u\/[^\/]+\/questions/.test(location.href)) {
                resolve([])
                return
            }
            let url = `/q/${id}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    token: document.cookie.match(/PHPSESSID=([^=&;\s]+)/)[1]
                },
                onload: function (response) {
                    try {
                        let doc = new DOMParser().parseFromString(response.response, 'text/html')
                        let list = Array.from(doc.querySelectorAll('.answer-area .list-group .list-group-item'));
                        list = list.map(item => {
                            let o = {}
                            o.isUse = item.querySelector('.answer-accept') !== null;
                            o.url = item.querySelector('.information picture').parentElement.href;
                            o.avatar = item.querySelector('.information picture img').src.replace(/[#].*/, '');
                            o.name = item.querySelector('.information [itemprop="name"]').innerText.trim();
                            o.time = item.querySelector('.information time').getAttribute('datetime');
                            o.content = item.querySelector('.article').innerHTML.trim();
                            o.id = item.querySelector('.article').id;
                            return o;
                        })
                        resolve(list)

                    } catch (e) {
                        console.log(e)
                        console.log(response)
                    }
                },
                onerror: function (err) {
                    reject(err)
                }
            });
        })
    }

    async function getList(backData) {
        let pageSize = backData.pageSize || 20;
        let pageIndex = backData.pageIndex || 1;
        return new Promise((resolve, reject) => {
            let username = location.href.match(/\/u\/([^\/]+)/)[1]
            let type = location.pathname.match(/[^\/]+$/)[0];
            let url = `https://segmentfault.com/gateway/homepage/${username}/${type}?size=${pageSize}&page=${pageIndex}&sort=newest`
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function (response) {
                    let data = JSON.parse(response.response)
                    backData.pageIndex = data.page;
                    backData.pageSize = data.size;
                    backData.totalPage = data.total_page;
                    backData.list = backData.list.concat(data.rows)
                    if (pageIndex >= backData.totalPage) {
                        resolve(backData)
                    } else {
                        backData.pageIndex = backData.pageIndex + 1;
                        getList(backData).then(resolve).catch(reject)
                    }
                },
                onerror: function (err) {
                    console.log(err)
                    reject(err)
                }
            });
        })
    }

    async function fetchBlob(url) {
        const response = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url,
                responseType: "blob",
                onload: resolve,
                onerror: reject,
            });
        });
        const {response: blob} = response;
        return blob;
    }
})();
