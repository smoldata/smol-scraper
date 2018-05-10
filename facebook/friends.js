var self = {

	namespace: 'facebook.com:friends',
	labels: {
		'en': {
			name: 'Facebook Friends',
			status: {
				inactive: 'Visit your <strong>Facebook Friends</strong> page to scrape data.',
				active: 'Ready to scrape.',
				scraping: 'Scraping the page.'
			}
		}
	},
	scraping: false,

	active: (url) => {
		const url_regex = /^https:\/\/www\.facebook\.com\/[^\/]+\/friends/;
		if (url.match(url_regex)) {
			return true;
		} else {
			return false;
		}
	},

	status: (url) => {
		if (self.scraping) {
			return 'scraping';
		} else if (self.active(url)) {
			return 'active';
		} else {
			return 'inactive';
		}
	},

	scrape: () => {

		self.scraping = true;
		const facebook_friend = (a, rank) => {

			const name = a.innerHTML;
			const attr_ajaxify = a.getAttribute('ajaxify');
			const attr_href = a.getAttribute('href');
			const attr_hovercard = a.getAttribute('data-hovercard');

			if (attr_ajaxify) {
				const status = 'inactive';
				const id = attr_ajaxify.match(/id=(\d+)/)[1];
				const href = null;
				const image = null;
			} else {
				const status = 'active';
				const id = attr_hovercard.match(/id=(\d+)/)[1];
				const href = attr_href.match(/^(.+)\?/)[1];
				let li = a.closest('li');
				const image = li.querySelector('img').getAttribute('src');
			}
			const now = JSON.stringify(new Date()).replace(/"/g, '');

			return {
				id: parseInt(id),
				name: name,
				href: href,
				image: image,
				rank: rank,
				status: status,
				scraped_at: now
			};
		};

		scraped[self.namespace] = {};
		browser.storage.local.remove(self.namespace);
		self.scrape_interval = setInterval(() => {

			var links = document.querySelectorAll('div.fsl.fwb.fcb a');
			var id, data, now;

			for (let a of links) {
				data = facebook_friend(q[i], i);
				scraped[self.namespace][data.id] = data;
			}

			var key_count = Object.keys(scraped[self.namespace]).length;
			if (key_count > count) {
				count = key_count;
				browser.storage.local.set(scraped);
				console.log('smol-scraper: ' + self.namespace + ' saved ' + count);
				window.scrollTo(0, window.scrollMaxY);
			}
		}, 1000);
	},

	stop: () => {
		self.scraping = false;
		if (self.scrape_interval) {
			clearInterval(self.scrape_interval);
			delete self.scrape_interval;
		}
	},

	data: () => {

		return new Promise(function(resolve, reject) {

			var data = {
				filename: 'facebook_friends.csv',
				cols: ['id', 'name', 'href', 'image', 'rank', 'status'],
				rows: []
			};

			browser.storage.local.get(self.namespace).then(function(rsp) {
				var rows = rsp[self.namespace];
				var row, cell;
				for (var id in rows) {
					row = [];
					data.cols.forEach(function(col) {
						cell = rows[id][col];
						row.push(cell);
					});
					data.rows.push(row);
				}
				resolve(data);
			}).catch(reject);

		});
	}
};

scrapers[self.namespace] = self;
