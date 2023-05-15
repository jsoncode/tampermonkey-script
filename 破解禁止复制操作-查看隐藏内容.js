// ==UserScript==
// @name         破解禁止复制操作,破解查看隐藏内容
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        **://*.csdn.net/*
// @run-at       document-idle
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
	// 页面加载完，清除所有js
	Array.from(document.querySelectorAll('script')).forEach(i => {
		i.parentElement.removeChild(i)
	})

	Array.from(document.querySelectorAll('*')).forEach(el => {
		// 移除事件
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

		if (getComputedStyle(el).userSelect !== 'auto') {
			el.style.userSelect = 'unset'
		}

		if (getComputedStyle(el).overflow !== 'hidden') {
			el.style.overflow = 'auto'
			el.style.height = 'unset'
		}
		if (getComputedStyle(el).overflowY !== 'hidden') {
			el.style.overflow = 'auto'
			el.style.height = 'unset'
		}
	})

	// 只在点击一次页面之后进行清理
	document.addEventListener('click', (e) => {
		Array.from(getParents(e.target))?.forEach(el => {
			if (getComputedStyle(el).block !== 'none') {
				el.style.display = 'block'
				el.style.height = 'unset'
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
