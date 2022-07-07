// ==UserScript==
// @name         采集中国省市县地区代码
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  固定页面的采集脚本,非通用脚本,谨慎使用. 原始网站随时失效.
// @author       You
// @match        **://**/**
// @icon         https://www.google.com/s2/favicons?domain=ip33.com
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
// ==/UserScript==

(function () {
    /*=============================================================================================================*/
    //采集中国省市县地区代码
    // GM_setValue('mergeList', '')
    if (document.body.innerText.includes('行政区划代码') && location.hostname.includes('.gov')) {
        //http://xxgk.mca.gov.cn/n164/n167/n185/n210/c12394/part/5156.html
        let year = document.body.innerText.match(/(\d+)年中华人民共和国|(\d+)年\d+月中华人民共和国|截止(\d+)年/)?.filter(item => /^\d+$/.test(item))?.[0]
        if (!year) {
            alert('没找到年份')
            return;
        }
        let list = Array.from(document.querySelectorAll('table tbody tr')).map(item => item.innerText.trim()).filter(item => /^\d{6}/.test(item));
        list = formatCode(list, year)
        // let oldList = GM_getValue('mergeList') ? JSON.parse(GM_getValue('mergeList')) : [];
        // oldList = mergeList(list, oldList)
        let oldList = list
        // GM_setValue('mergeList', JSON.stringify(oldList))
        // showChangeCount(oldList, list)
        let str = toStr(oldList, true)
        // 最简压缩,已经没有可以再压缩的空间了。
        // console.log(crazyMin(str).res)
        addHtml(document.querySelector('body'), str, 2)
    } else if (/:\/\/www\.b910\.cn\/tool\/\d+\.htm/i.test(location.href)) {
        //https://www.b910.cn/tool/1.htm
        let list = Array.from(document.querySelectorAll('table tbody tr')).map(item => item.innerText.trim().replace(/中国,+/, '')).filter(item => /^\d{6}/.test(item));
        list = formatCode(list)
        let str = toStr(list)
        addHtml(document.querySelector('body'), str, 2)
    } else if (/\/\/www\.ip33\.com\/area\/\d+\.html/i.test(location.href)) {
        let list = Array.from(document.querySelectorAll('.ip')).filter(item => Array.from(item.children).filter(s => s.tagName === 'UL').length === 1)
        let data = list.map(item => {
            let child = Array.from(Array.from(item.children).filter(s => s.tagName === 'UL')[0].children)
            let id = Array.from(item.children).filter(s => s.tagName === 'H4')[0].innerText.trim().split(/\s+/)
            return {
                id: id[1], name: id[0], child: child.map((s, i) => {
                    let sid = Array.from(s.children).filter(s => s.tagName === 'H5')[0].innerText.trim().split(/\s+/)
                    return {
                        id: sid[1], name: sid[0], child: Array.from(s.querySelectorAll('li')).map(ss => {
                            let ssid = ss.innerText.trim().split(/\s+/)
                            return {
                                id: ssid[1], name: ssid[0],
                            }
                        })
                    }
                })
            };
        })

        let str = toStr(sortList(data))
        let title = document.querySelector('.title')
        addHtml(title, str, 3)
    }

    function addHtml(el, str, position) {
        let p = {
            1: 'beforebegin', 2: 'afterbegin', 3: 'beforeend', 4: 'afterend',
        }
        el.insertAdjacentHTML(p[position], `<textarea style="width:100%;min-width: 500px;height:400px;tab-size:4;font-size:12px;line-height:1.5;">${str}</textarea>`)
    }

    function showChangeCount(oldList, newList) {
        let oldStr = JSON.stringify(oldList).match(/"id":/ig) || []
        let newStr = JSON.stringify(newList).match(/"id":/ig) || []
        console.log('数据变更：', oldStr.length, '-', newStr.length, '=', oldStr.length - newStr.length)
    }

    function crazyMin(res) {
        let map = {}
        let mapK = {}
        res = res.replace(/[\n\r\f\x20]+/g, '').replace(/\t/g, '.').replace(/\|\d/g, '|')
        res.match(/[^\x00-\xff]/g).forEach(item => {
            if (map[item] === undefined) {
                map[item] = 1;
            } else {
                map[item]++;
            }
        })
        let list = []
        for (let i in map) {
            let val = map[i]
            list.push({
                name: i,
                count: val
            })
        }
        list = list.sort((a, b) => b.count - a.count)
        list.length = 26
        list.forEach((item, index) => {
            let key = String.fromCharCode(index + 97)
            res = res.replace(new RegExp(item.name, 'g'), key)
            mapK[key] = item.name;
        })
        return {
            res,
            mapK
        }
    }

    function toStr(data, isMin) {
        let str = ''
        //return JSON.stringify(data, null, 4)
        data.forEach(item => {
            // 省
            if (isMin) {
                item.id = item.id.match(/^(\d{2})/)[1]
            }
            str += `${item.id} ${item.name}|${item.year}\n`;
            if (item.child) {
                item.child.forEach(s => {
                    // 市
                    if (isMin) {
                        s.id = s.id.match(/^\d{2}(\d{2})/)[1]
                    }
                    str += `\t${s.id} ${s.name}|${s.year}\n`
                    if (s.child) {
                        s.child.forEach(ss => {
                            // 县
                            if (isMin) {
                                ss.id = ss.id.match(/^\d{2}\d{2}(\d{2})/)[1]
                            }
                            str += `\t\t${ss.id} ${ss.name}|${ss.year}\n`
                            if (ss.child) {
                                ss.child.forEach(sub => {
                                    // 街道
                                    if (isMin) {
                                        sub.id = sub.id.match(/^\d{2}\d{2}\d{2}(\d{3})/)[1]
                                    }
                                    str += `\t\t\t${sub.id} ${sub.name}|${sub.year}\n`
                                    if (sub.child) {
                                        sub.child.forEach(j => {
                                            // 居委会
                                            if (isMin) {
                                                j.id = j.id.match(/^\d{2}\d{2}\d{2}\d{3}(\d{3})/)[1]
                                            }
                                            str += `\t\t\t\t${j.id} ${j.name}|${j.year}\n`
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
        return str;
    }

    function mergeList(newList, oldList) {
        newList.forEach(item => {
            let id = item.id
            let newChild = item.child
            let oldIndex = oldList.findIndex(a => a.id === id)
            if (oldIndex < 0) {
                oldList.push(item)
            } else {
                let oldItem = oldList[oldIndex]
                if (item.name === oldItem.name) {
                    if (newChild && oldItem.child) {
                        mergeList(newChild, oldItem.child)
                    } else {
                        oldItem = {
                            ...oldItem,
                            child: oldItem.child || newChild,
                        }
                        oldList[oldIndex] = oldItem
                    }
                } else {
                    if (newChild && oldItem.child) {
                        oldList[oldIndex].name = item.name
                        mergeList(newChild, oldItem.child)
                    } else {
                        oldItem = {
                            ...oldItem,
                            child: oldItem.child || newChild,
                        }
                        oldList[oldIndex] = oldItem
                    }
                }
            }
        })
        return sortList(oldList)
    }

    function formatCode(list, year) {
        year *= 1
        let newList = [];
        let toggle = true;
        list.forEach(item => {
            item = item.replace(/o/ig, '0')
            let r = item.split(/[\s|]+/);
            // 处理只有id没有名字的情况
            if (r.length !== 2) {
                return
            }
            let id = /^\d+$/.test(r[0]) ? r[0] : r[1];
            let idMatch = id.match(/(\d{2})(\d{2})(\d{2})(\d{3})?(\d{3})?/)
            if (!idMatch) {
                console.log('没有匹配到符合的id', item, id)
            }
            idMatch = idMatch.filter(item => item !== id && item !== undefined)
            let name = /^\d+$/.test(r[0]) ? r[1] : r[0];
            name = name.replace(/,|，/g, '')
            let sheng = newList[newList.length - 1]
            if (idMatch[1] === '00' && idMatch[2] === '00') {
                // 省
                name = name.split(/[,，]/)
                name = name[name.length - 1]
                newList.push({
                    year, id: idMatch[0], name, child: [],
                })
            } else if (idMatch[2] === '00') {
                // 市
                name = name.replace(new RegExp(`${sheng.name}`, 'ig'), '')
                sheng.child.push({
                    year, id: idMatch[0] + idMatch[1], name, child: [],
                })
            } else if (sheng.child[sheng.child.length - 1] === undefined) {
                // 处理市辖区数据
                name = name.replace(new RegExp(`${sheng.name}`, 'ig'), '')
                sheng.child.push({
                    year, id: idMatch[0] + idMatch[1], name: '市辖区', child: [{
                        year, id: idMatch[0] + idMatch[1] + idMatch[2], name, child: [],
                    }]
                })
            } else if (idMatch.length === 3 && idMatch[2] !== '00' || idMatch.length === 5 && idMatch[2] !== '00' && idMatch[3] === '000' && idMatch[4] === '000') {
                // 县
                let shi = sheng.child[sheng.child.length - 1]
                name = name.replace(new RegExp(`${sheng.name}|${shi.name}`, 'ig'), '')
                shi.child.push({
                    year, id: idMatch[0] + idMatch[1] + idMatch[2], name, child: [],
                })
            } else if (idMatch.length === 5 && idMatch[3] !== '000' && idMatch[4] === '000') {
                // 街道
                let shi = sheng.child[sheng.child.length - 1]
                let xian = shi.child[shi.child.length - 1]
                // 遇到直接跳过县级的街道的情况
                if (xian === undefined) {
                    shi.child.push({
                        year, id: idMatch[0] + idMatch[1] + idMatch[2], name: '--', child: [],
                    })
                    xian = shi.child[shi.child.length - 1]
                }
                name = name.replace(new RegExp(`${sheng.name}|${shi.name}|${xian.name}`, 'ig'), '')
                xian.child.push({
                    year, id: idMatch[0] + idMatch[1] + idMatch[2] + idMatch[3], name, child: [],
                })
            } else if (idMatch.length === 5 && idMatch[4] !== '000') {
                // 居委会
                let shi = sheng.child[sheng.child.length - 1]
                let xian = shi.child[shi.child.length - 1]
                let jiedao = xian.child[xian.child.length - 1]
                // 遇到直接跳过街道，直属居委会的情况
                if (jiedao === undefined) {
                    xian.child.push({
                        year, id: idMatch[0] + idMatch[1] + idMatch[2] + idMatch[3], name: '--', child: [],
                    })
                    jiedao = xian.child[xian.child.length - 1]
                }
                name = name.replace(new RegExp(`${sheng.name}|${shi.name}|${xian.name}|${jiedao.name}`, 'ig'), '')
                jiedao.child.push({
                    year, id, name,
                })
            }
        })
        newList = sortList(newList)
        return newList
    }

    function sortList(list) {
        list = list.map(item => {
            if (item.child) {
                if (item.child.length) {
                    item.child = sort(item.child)
                    sortList(item.child)
                } else {
                    delete item.child
                }
            }
            return item
        })
        return sort(list)
    }

    function sort(list) {
        return list.sort((a, b) => a.id * 1 - b.id * 1)
    }
    /*=============================================================================================================*/
})();
