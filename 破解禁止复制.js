// ==UserScript==
// @name         破除禁止复制，弹框
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        **://*.csdn.net/*
// @match        **://*.zhihu.com/*
// @match        **://*.juejin.cn/*
// @run-at       document-end
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
	let time = 0;
	// 定时检查，进行清理
	let timer = setInterval(() => {
		if (location.host.includes('csdn')) {
			Array.from(document.querySelectorAll('.look-more-preCode')).forEach(el => {
				el.click()
			})
		}
		if (location.host.includes('zhihu')) {
			Array.from(document.querySelectorAll('.Modal-closeButton')).forEach(el => {
				el.click()
			})
		}
		let html = document.body.innerHTML

		if (html.includes('继续访问') && /<\w+[^<>]*>https?:\/\/[^<>]+<\/\w>/.test(html)) {
			let url = html.match(/<\w+[^<>]*>(https?:\/\/[^<>]+)<\/\w>/)?.[1]
			location.replace(url)
		}

		time += 500;
		if (time > 10000) {
			clearInterval(timer)
		}
	}, 500);

	// 清除事件
	Array.from(document.querySelectorAll('*')).forEach(el => {
		// 清除通用事件
		let eventName = ['oncopy', 'onselectstart', 'onselectend', 'onkeyup', 'onkeydown']
		eventName.forEach(ev => {
			el[ev] = false;
		})
		eventName.forEach(ev => {
			el.addEventListener(
				ev.replace(/^on/, ''),
				event => event.stopImmediatePropagation(),
				true
			)
		})

		// 清除通用样式
		if (getComputedStyle(el).userSelect !== 'auto') {
			el.style.userSelect = 'unset'
		}
	})

	// 打开隐藏内容
	document.addEventListener('click', (e) => {
		Array.from(getParents(e.target))?.forEach(el => {
			if (getComputedStyle(el).block !== 'none') {
				el.style.display = 'block'
			}
			if (getComputedStyle(el).overflow !== 'hidden') {
				el.style.overflow = 'auto'
			}
			if (getComputedStyle(el).overflowY !== 'hidden') {
				el.style.overflow = 'auto'
			}
		})
	})

	// 递归获取所有祖先元素
	function getParents(tag) {
		let list = [];
		get(tag)

		function get(e) {
			let p = e.parentElement;
			// 删除每一层的事件
			if (!p) {
				return
			}
			removeEventListener(p)
			list.push(p)
			if (p.tagName !== 'HTML') {
				return get(p)
			}
			return p
		}

		return list;
	}
})();
