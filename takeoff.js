[   injectAnnouncementsRequest,
    //injectMealsRequest,
    fetchWeather,
    insertDay
].each(function (f) { document.addEvent('domready', f); });

var baseURL         = 'https://docs.google.com/a/frontier.k12.in.us/spreadsheets/d/',
    announcementsID = '1WdvyXz6LbB12GknlRO0QY8vFHTkCX4zoHkQ6i10Xcfw',
    mealsID         = '1a2G6_26ygUNKcFdf90SQYV9noIUvaTufkcBUo6s0zBs';

var longDays = [
    'Sunday',  'Monday', 'Tuesday', 'Wednesday',
    'Thursday','Friday', 'Saturday'
], shortDays = [ 'Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat' ];

// this is basically a trick to avoid using Google's huge APIs for something so simple.
var google = { visualization: { Query: { setResponse: handleResponse } } };

var d = new Date();
var dateStr = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

function injectAnnouncementsRequest () {
    var query = "select * where D=date '"+dateStr+"' order by A desc limit 1";

    // inject a script tag for Google's spreadsheet APIs.
    query = encodeURIComponent(query);
    var script  = new Element('script', {
        src:  baseURL + announcementsID + '/gviz/tq?tq=' + query,
        type: 'text/javascript'
    });

    document.head.adopt(script);
}

// MEALS AND ANNOUNCEMENTS

function injectMealsRequest () {
    var query = "select * where F=date '"+dateStr+"' order by A desc limit 1";

    // inject a script tag for Google's spreadsheet APIs.
    query = encodeURIComponent(query);
    var url = baseURL + mealsID + '/gviz/tq?tq=' + query;
    var script  = new Element('script', {
        src:   url,
        type: 'text/javascript'
    });

    document.head.adopt(script);
}

function handleResponse (res) {

    // some error occurred.
    if (res.status != 'ok')
        return;

    if (res.table.cols[1].label == 'General announcements') {
        if (!handleAnnouncementsResponse(res))
            $('sad-falcon').setStyle('display', 'block');
    }
    else
        handleMenuResponse(res);
}

function handleAnnouncementsResponse (res) {
    $('to-announcements-header').setStyle('display', 'block');
    var announcements = $('to-announcements'),
        meetings      = $('to-meetings');

    // consider: if not logged in, this will be a redirect...
    // how will Chrome handle a <script> tag leading to text/html?
    // probably just won't do anything.

    // the row will be the first and only row, since the query
    // limits to one result.
    var row = res.table.rows[0];
    if (!row)
        return;

    // 0 (A) Timestamp
    // 1 (B) Announcements
    // 2 (C) Username
    // 3 (D) Date for announcements
    // 4 (E) Meetings

    // the date is not today.
    if (row.c[3].v.toDateString() != new Date().toDateString())
        return;

    if (row.c[1].v) {
        announcements.innerText = row.c[1].v.trim();
        announcements.boldifyToday();
    }

    if (row.c[4].v) {
        meetings.innerText = row.c[4].v.trim();
        meetings.setStyle('display', 'block');
        $('to-meetings-header').setStyle('display', 'block');
        meetings.boldifyToday();
    }

    return true;
}

function handleMenuResponse (res) {
    var meals = $('to-meals'),
        lunch = $('to-lunch'),
        bkfst = $('to-breakfast'),
        row   = res.table.rows[0];
    if (!row)
        return;

    // 0 (A) Timestamp
    // 1 (B) Username
    // 2 (C) Lunch
    // 3 (D) Breakfast
    // 4 (E) Salad choice
    // 5 (F) Date it applies to

    // set breakfast, lunch, and salad.
    if (row.c[3].v) bkfst.innerText = row.c[3].v.trim();
    if (row.c[2].v) lunch.innerText = row.c[2].v.trim();
    if (row.c[4].v) lunch.innerText += "\n" + row.c[4].v.trim() + ' salad';

    // show these if there's info to put there.
    if (bkfst.innerText || lunch.innerText)
        meals.setStyle('display', 'block');

    return true;
}

// EXTENSIONS

Element.implement('boldifyToday', function () {
    var day = longDays[ d.getDay() ];
    var re = new RegExp(day, 'g');
    this.innerHTML = this.innerHTML.replace(re, '<b>' + day + '</b>');
    this.innerHTML = this.innerHTML.replace(/Today/g, '<b>Today</b>');        
});

Element.implement('prependChild', function (el) {
    this.insertBefore(el, this.firstChild);
});

// WEATHER AND DATE

var R = Math.round;

function fetchWeather () {
    var url = 'http://api.openweathermap.org/data/2.5/weather?q=Chalmers,IN&units=imperial&callback=gotWeather';
    var script = new Element('script', { src: url, type: 'text/javascript' });
    document.head.appendChild(script);
}

function gotWeather (data) {
    var el = new Element('div', { id: 'to-weather-icon' });
    el.innerHTML = '&nbsp;' + R(data.main.temp) + "\xB0";
    var icon = data.weather[0].icon;
    el.setStyle('background-image', 'url(http://openweathermap.org/img/w/' + icon + '.png)');
    el.setAttribute('title',
        data.weather[0].description             +  "\n"     +
        'Humidity: ' + data.main.humidity       + "%\n"     +
        'Now:      ' + R(data.main.temp)        + "\xB0\n"  +
        'High:     ' + R(data.main.temp_max)    + "\xB0\n"  +
        'Low:      ' + R(data.main.temp_min)    + "\xB0"
    );
    $('to-sidebar-info').prependChild(el);
}

function insertDay () {
    var _for = new Element('span', { styles: {
        fontSize: '60%',
        color: '#ffb0b0'
    } });
    _for.innerHTML = '&nbsp;&nbsp;for&nbsp;&nbsp;';
    
    var today = new Element('span', { styles: { fontSize: '70%' } });
    today.innerText = longDays[d.getDay()];
    
    $$('#to-sidebar-info h2')[0].appendChild(_for);
    $$('#to-sidebar-info h2')[0].appendChild(today);
}

