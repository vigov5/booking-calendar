/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  authorizeButton = document.getElementById('authorize-button');
  signoutButton = document.getElementById('signout-button');
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    discoveryDocs: googleCalendar.DISCOVERY_DOCS,
    clientId: googleCalendar.CLIENT_ID,
    scope: googleCalendar.SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}

function getUserEmail(){
  gapi.client.plus.people.get({
    userId: 'me'
  }).then(function(response) {
    email = response.result.emails[0].value;
    console.log(email);
    getCalendarRole(email);
  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
    googleCalendar["role"] = "reader";
  });
}

function getCalendarRole(email){
  gapi.client.calendar.acl.get({
    'calendarId': googleCalendar.Calendar_Id,
    'ruleId': "user:" + email
  }).then(function(response) {
    googleCalendar["role"] = response.result.role;
  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
    googleCalendar["role"] = "reader";
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    getUserEmail();
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
  } else {
    googleCalendar["role"] = "anonymous";
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }

  myVar = setInterval(function(){ myTimer() }, 1000);
}

function myTimer(){
  console.log("check check !");
  if (googleCalendar.role != undefined) {
    clearInterval(myVar);
    $.getScript("js/app.js", function(){
      // alert("Script loaded but not necessarily executed.");
    });
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents(start, end, timezone, callback) {
  console.log(start);
  console.log(end);
  console.log(timezone);
  console.log(callback);
  x = start;
  gapi.client.calendar.events.list({
    'calendarId': googleCalendar.Calendar_Id,
    'timeMin': start.utc().toISOString(),
    'timeMax': end.utc().toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'orderBy': 'startTime'
  }).then(function(response) {
    events = response.result.items;
    eventsList = [];
    $.each(events, function(i, entry) {
      var url = entry.htmlLink;

      // make the URLs for each event show times in the correct timezone
      if (timezone) {
         url = injectQsComponent(url, 'ctz=' + timezone);
      }

      eventsList.push({
        id: entry.id,
        title: entry.summary,
        start: entry.start.dateTime || entry.start.date, // try timed. will fall back to all-day
        end: entry.end.dateTime || entry.end.date, // same
        url: url,
        description: entry.description || "demo"
      });
    });
    callback(eventsList);
    console.log(eventsList);

    return eventsList;
  });
}
