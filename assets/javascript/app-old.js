// Initialize Firebase
var config = {
    apiKey: "AIzaSyCp2giHwlONuUAg2fxDUhGiCv0uhmx2qY4",
    authDomain: "trainscheduler-34922.firebaseapp.com",
    databaseURL: "https://trainscheduler-34922.firebaseio.com",
    projectId: "trainscheduler-34922",
    storageBucket: "",
    messagingSenderId: "1095004405422"
};
firebase.initializeApp(config);


// Create a variable to reference the database.
var database = firebase.database();

// -----------------------------

var connectionsRef = database.ref("/connections");

var connectedRef = database.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function (snap) {

    // If they are connected..
    if (snap.val()) {

        // Add user to the connections list.
        var con = connectionsRef.push(true);
        // Remove user from the connection list when they disconnect.
        con.onDisconnect().remove();
    }
});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function (snap) {

    // Display the viewer count in the html.
    // The number of online users is the number of children in the connections list.
    //  $("#connected-viewers").text(snap.numChildren());
});

// --------------------------------------------------------------

database.ref("/trainTimeData").on("value", function (snapshot) {

    // ------------------------------------

    $("#train-info").empty();

    snapshot.forEach(function (childSnapshot) {

        //check for valid child
        if (!childSnapshot.child("trainName").exists()) {
            return;
        }
        var trainName = childSnapshot.val().trainName;
        var trainDestination = childSnapshot.val().trainDestination;
        var trainFrequency = childSnapshot.val().trainFrequency;
        var trainFirstTime = childSnapshot.val().trainFirstTime;


        var trainFirstMoment = moment(trainFirstTime, "HH:mm").subtract(1, "days");
        var differenceInMinutes = Math.floor(moment().diff(trainFirstMoment) / 60000);

        // Assume the next train time is in the future unless diff tells us it's in the past
        var trainNextMoment = trainFirstMoment;


        if (differenceInMinutes > 0) {
            var remaining = trainFrequency - (differenceInMinutes % trainFrequency);
            trainNextMoment = moment().add(remaining, "minutes");
        }

        var trainArrivalTime = trainNextMoment.format("HH:mm:ss a");
        var minutesAway = Math.floor(trainNextMoment.diff(moment()) / 60000);

        // Show form stuff
        var newRow = $("<tr>");
        var trainNameDisplay = $("<td>").text(trainName);
        var trainDestinationDisplay = $("<td>").text(trainDestination);
        var trainFrequencyDisplay = $("<td>").text(trainFrequency);
        var trainNextTimeDisplay = $("<td>").text(trainArrivalTime);
        var trainMinutesDisplay = $("<td>").text(minutesAway);

        newRow.append(trainNameDisplay, trainDestinationDisplay, trainFrequencyDisplay, trainNextTimeDisplay, trainMinutesDisplay);
        $("#train-info").append(newRow);

        countDown(trainArrivalTime);

    });

}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

function countDown() {
    setInterval(function() { }, 1000);
}

// Form Stuff: Click event

$("#submit").on("click", function (event) {
    event.preventDefault();

    // Text input variables
    var trainName = $("#train-name").val().trim();
    var trainDestination = $("#train-destination").val().trim();
    var trainFirstTime = $("#train-time-first").val().trim();
    var trainFrequency = $("#train-frequency").val().trim();

    database.ref("/trainTimeData").push({
        trainName: trainName,
        trainDestination: trainDestination,
        trainFrequency: trainFrequency,
        trainFirstTime: trainFirstTime,
        dateAdded: firebase.database.ServerValue.TIMESTAMP
    });

    if (trainFirstTime !== moment("HH:mm")) {
        $("#alert-wrapper").html("<div class='alert alert-danger' role='alert'>This is not a valid time!</div>");
    }

});

// Clear form
$("#submit").on("click", function (event) {
    $("#train-form")[0].reset();
});



