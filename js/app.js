/**
 * Created by dinhtungtp on 4/24/2017.
 */
var a, v, e, clr, r, stickyHeader;

// Approximate matching options
var options = {
    include: ["score"],
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 50,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
        "title"
    ]
};

$(document).ready(function() {
    // page is now ready, initialize the calendar...
    clr = $('#calendar');
    $('#calendar').fullCalendar({
        // put your options and callbacks here
        header: {
            right: 'prev,next today',
            center: 'title'
        },
        selectable: false,
        editable: false,
        nowIndicator: true,
        defaultView: 'agendaDay',
        minTime: '06:00:00',
        allDaySlot:true,
        allDayText:'Room',

        // get events from GG API
        googleCalendarApiKey: googleCalendar.API_KEY,
        events: {
            googleCalendarId: googleCalendar.Calendar_Id
        },

        // render events
        eventAfterRender: function(event, element, view) {
            e = event;
            r = getRoomName(event);
            element.css('background-color', colors[r]);
            element.css('border-color', colors[r]);
            if (view.type != "month" && event.start.hasTime()) {

                // Show bad events
                bad_event = checkOverlap(event);
                if (bad_event) {
                    time_txt = bad_event.start.format("h:mm a") + " - " + bad_event.end.format("h:mm a");
                    $("#overlap-info").append(bad_event.title + ' - ' + time_txt + '<br>');
                }

                // Differentiate past events
                element.css('margin-right', 0);
                if (event.end < Date.now()) {
                    element.css('opacity', 0.5);
                }

                // positioning each event
                pos = rooms.indexOf(r);
                width = 100 / rooms.length;

                // l - left magrin, r - right margin
                l = pos * width;
                element.css('left', l + '%');
                element.css('width', width + '%');
            }

            // Create box when hover
            if (!event.tip) {
                event.tip = new jBox('Tooltip', {
                    title: event.title,
                    content: initDialog(event),
                    attach: $(element),
                    closeOnMouseleave: true,
                    adjustPosition: 'flip',
                    adjustPosition: {top: 50, right: 5, bottom: 20, left: 5},
                    repositionOnOpen: true,
                });
            }
        },

        eventAfterAllRender: function (){
            var view = $('#calendar').fullCalendar('getView');
            if (view.type == "agendaDay") {
                mini.setDate(
                    $('#calendar').fullCalendar('getDate').format("YYYY-MM-DD")
                );
            }

        },

        viewRender: function(view, element) {
            $("#overlap-info").html("");
        },
    });

    // refetch events after a minute
    setInterval(function(){
        $("#overlap-info").html("");
        clr.fullCalendar('refetchEvents')
    }, 60000);


    function getRoomName(event){
        for (var i = rooms.length - 1; i >= 0; i--) {
            if (event.title != null){
                title = removeDiacritics(event.title.toLowerCase());
                if (title.indexOf(rooms[i].toLowerCase()) != -1) {
                    event.room = rooms[i];
                    return rooms[i];
                }
            }
        }

        for (var i = rooms.length - 1; i >= 0; i--) {
            if (event.title != null){
                title = removeDiacritics(event.title.toLowerCase());
                var list = [{"title": title}];
                var fuse = new Fuse(list, options);
                var result = fuse.search(rooms[i]);
                if (result.length>0) {
                    event.room = rooms[i];
                    return rooms[i];
                }
            }
        }

        event.room = "Other";
        return "Other";
    }

    function checkOverlap(event) {

        var start = new Date(event.start);
        var end = new Date(event.end);

        // Check if event is booked in Ban tron, rooms[2]
        if (event.title != null){
            title = removeDiacritics(event.title.toLowerCase());
        }
        if (title.indexOf("ban tron") != -1) {
            return false;
        }

        var overlap = $('#calendar').fullCalendar('clientEvents', function(ev) {
            if( ev == event)
                return false;
            var estart = new Date(ev.start);
            var eend = new Date(ev.end);

            return (Math.round(estart)/1000 < Math.round(end)/1000 && Math.round(eend) > Math.round(start) && ev.room == event.room);
        });

        if (overlap.length){
            return event;
        }
    }

    function initDialog(event){
        time_txt = event.start.format("h:mm a") + " - " + event.end.format("h:mm a");
        tpl = $("#event-tooltip");
        tpl.find("#event-when").html(time_txt);
        tpl.find("#event-url").attr('href', event.url);
        return tpl.html();
    }

    mini = $("#minicalendar").flatpickr({
        onChange: function(selectedDates, dateStr, instance) {
            $('#calendar').fullCalendar('gotoDate', new Date(dateStr));
        }
    });

    $(window).scroll(function(){
        var pos = $('#calendar').offset().top,
            scroll = $(window).scrollTop();
        if (scroll >= pos + 100) {
            $('#room-title').show();
        }
        else {
            $('#room-title').hide();
        }

    })

});