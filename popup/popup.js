
var scrapers = {};
const lang = navigator.language.substr(0, 2);

function process_csv_row(row) {
	var line = '';
	var cell;
	for (var i = 0; i < row.length; i++) {
		cell = (row[i] === null ? '' : row[i].toString());
		if (row[i] instanceof Date) {
			cell = JSON.stringify(row[i]).replace(/"/g, '');
		}
		cell = cell.replace(/"/g, '""');
		if (cell.search(/("|,|\n)/g) >= 0) {
			cell = `"${cell}"`;
		}
		if (i > 0) {
			line += ',';
		}
		line += cell;
	}
	return line + '\n';
};

function save_csv(data) {

	// Adapted from https://stackoverflow.com/a/24922761

	var csv = process_csv_row(data.cols);
	for (var i = 0; i < data.rows.length; i++) {
		csv += process_csv_row(data.rows[i]);
	}

	var blob = new Blob([csv], {
		type: 'text/csv;charset=utf-8;'
	});

	var url = URL.createObjectURL(blob);
	var link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", data.filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

document.addEventListener('click', function(e) {

	var id = e.target.getAttribute('id');
	var class_name = e.target.getAttribute('class');
	var namespace = e.target.getAttribute('data-namespace');

	if (class_name && class_name.indexOf('inactive') !== -1) {
		return;
	} else if (id == 'scrape') {
		const tab_query = {
			active: true,
			currentWindow: true
		};
		browser.tabs.query(tab_query).then(function(tabs) {
			browser.tabs.sendMessage(tabs[0].id, {
				command: 'scrape',
				namespace: namespace
			}).catch(function(err) {
				console.error(err);
			});
		});
	} else if (id == 'save') {
		scrapers[namespace].data().then(function(data) {
			save_csv(data);
		}).catch(function(err) {
			console.error(err);
		});
	} else if (id == 'done') {
		document.querySelector('#main').className = '';
		document.querySelector('#scraper').className = 'hidden';
	} else if (namespace) {

		const name = scrapers[namespace].labels[lang].name;
		document.querySelector('#scraper .label').innerHTML = name;
		document.querySelector('#main').className = 'hidden';
		document.querySelector('#scraper').className = '';

		const scrape = document.querySelector('#scrape');
		scrape.setAttribute('data-namespace', namespace);

		const save = document.querySelector('#save');
		save.setAttribute('data-namespace', namespace);

		browser.storage.local.get(namespace).then(function(data) {
			if (data && data[namespace] &&
			    Object.keys(data[namespace]).length > 0) {
				save.className = '';
			} else {
				save.className = 'inactive';
			}
		});

		const tab_query = {
			active: true,
			currentWindow: true
		};
		browser.tabs.query(tab_query).then(function(tabs) {
			const url = tabs[0].url;
			if (scrapers[namespace].active(url)) {
				document.querySelector('#scrape').className = '';
			} else {
				document.querySelector('#scrape').className = 'inactive';
			}
			const status = scrapers[namespace].status(url);
			const info = scrapers[namespace].labels[lang].status[status];
			document.querySelector('#info').innerHTML = info;
		});

	}
}, false);

window.addEventListener('load', function() {
	var html = '';
	for (let namespace in scrapers) {
		let label = scrapers[namespace].labels[lang].name;
		html += `<li data-namespace="${namespace}">${label}</li>`;
	}
	document.getElementById('scrapers').innerHTML = html;
}, false);
