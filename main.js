    
    var baseURL         = 'https://docs.google.com/a/frontier.k12.in.us/spreadsheets/d/',
        announcementsID = '1WdvyXz6LbB12GknlRO0QY8vFHTkCX4zoHkQ6i10Xcfw',
        mealsID         = '1a2G6_26ygUNKcFdf90SQYV9noIUvaTufkcBUo6s0zBs';
    
    var longDays = [
        'Sunday',  'Monday',
        'Tuesday', 'Wednesday',
        'Thursday','Friday',
        'Saturday'
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
        if (res.status != 'ok') return;
        
        if (res.table.cols[1].label == 'General announcements') {
            if (!handleAnnouncementsResponse(res))
                $('sad-falcon').setStyle('display', 'block');
        }
        else
            handleMenuResponse(res);
    }
    
    function handleAnnouncementsResponse (res) {
        var announcements = $('to-announcements'),
            meetings      = $('to-meetings');
        
        // consider: if not logged in, this will be a redirect...
        // how will Chrome handle a <script> tag leading to text/html?
        // probably just won't do anything.
                
        // the row will be the first and only row, since the query
        // limits to one result.
        var row = res.table.rows[0];
        if (!row) return;
         
        // 0 (A) Timestamp
        // 1 (B) Announcements
        // 2 (C) Username
        // 3 (D) Date for announcements
        // 4 (E) Meetings
        
        // the date is not today.
        if (row.c[3].v.toDateString() != new Date().toDateString())
            return;
        
        if (row.c[1].v) {
            announcements.innerText = row.c[1].v;
            announcements.boldifyToday();
        }
        
        if (row.c[4].v) {
            meetings.innerText = row.c[4].v;
            meetings.setStyle('display', 'block');
            $('to-meetings-header').setStyle('display', 'block');
            meetings.boldifyToday();
        }
        
        $('to-announcements-header').setStyle('display', 'block');
        return true;
    }
    
    function handleMenuResponse (res) {
        var meals = $('to-meals'),
            lunch = $('to-lunch'),
            bkfst = $('to-breakfast'),
            row   = res.table.rows[0];
        if (!row) return;
        
        // 0 (A) Timestamp
        // 1 (B) Username
        // 2 (C) Lunch
        // 3 (D) Breakfast
        // 4 (E) Salad choice
        // 5 (F) Date it applies to
        
        // set breakfast, lunch, and salad.
        if (row.c[3].v) bkfst.innerText = row.c[3].v;
        if (row.c[2].v) lunch.innerText = row.c[2].v;
        if (row.c[4].v) lunch.innerText += "\n\n" + row.c[4].v + ' salad';
        
        // show these if there's info to put there.
        if (bkfst.innerText || lunch.innerText)
            meals.setStyle('display', 'block');
        
        return true;
    }
    
    Element.implement('boldifyToday', function () {
        var day = longDays[d.getDay()];
        var re = new RegExp(day, 'g');
        console.log(re);
        this.innerHTML = this.innerHTML.replace(re, '<b>' + day + '</b>');
        this.innerHTML = this.innerHTML.replace(/Today/g, '<b>Today</b>');        
    });
    
    Element.implement('prependChild', function (el) {
        this.insertBefore(el, this.firstChild);
    });
    
    function fetchWeather () {
        var url = 'http://api.openweathermap.org/data/2.5/weather?q=Chalmers,IN&callback=gotWeather';
        var script = new Element('script', { src: url, type: 'text/javascript' });
        document.head.appendChild(script);
    }
    
    function gotWeather (data) {
        console.log(data);
        var fahr = Math.round((273.5 - data.main.temp) * (9/5) + 32);
        var el = new Element('div', { 'class': 'to-sidebar-info' });
        el.innerHTML = '&nbsp;' + fahr + 'º';
        $('to-sidebar-info').prependChild(el);
    }


    function insertDay () {
        var el = new Element('div', { 'class': 'to-sidebar-info' });
        el.innerText = longDays[d.getDay()];
        $('to-sidebar-info').prependChild(el);
    }
    
    [   injectAnnouncementsRequest,
        injectMealsRequest,
        fetchWeather,
        insertDay
    ].each(function (f) { document.addEvent('domready', f); });
    