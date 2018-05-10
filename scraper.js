
console.log('smol-scraper');

var scrapers = {};
var scraped = {};
var count = 0;

browser.runtime.onMessage.addListener(function(msg) {
	console.log('msg', msg);
	if (! scrapers[msg.namespace] ||
		! scrapers[msg.namespace].active(location.href)) {
		return Promise.reject();
	} else if (msg.command == 'scrape') {
		scrapers[msg.namespace].scrape();
		return Promise.resolve();
	} else if (msg.command == 'stop') {
		scrapers[msg.namespace].stop();
		return Promise.resolve();
	} else {
		return Promise.reject();
	}
});

if (location.host == 'smoldata.org') {
	browser.storage.local.get().then(function(data) {
		for (let namespace in data) {
			let count = Object.keys(data[namespace]).length;
			console.log(namespace + ' ' + count);
		}
	});
}
