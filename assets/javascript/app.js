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


// --------------------------------------------------------------

var intervalId = undefined;
var currentSnapshot = null;

function displaySnapshot(snapshot) {

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


        var trainFirstMoment = moment(trainFirstTime, "HH:mm A"); //.subtract(1, "days");
        var differenceInMs = moment().diff(trainFirstMoment);

        // Assume the next train time is in the future unless diff tells us it's in the past
        var trainNextMoment = trainFirstMoment;


        if (differenceInMs > 0) {
            var remaining = (trainFrequency * 60000) - (differenceInMs % (trainFrequency * 60000));
            trainNextMoment = moment().add(remaining);
        }

        var trainArrivalTime = trainNextMoment.format("HH:mm A");
        var minutesAway = Math.ceil(trainNextMoment.diff(moment()) / 60000);

        // Show form stuff
        var newRow = $("<tr>");
        var trainNameDisplay = $("<td>").text(trainName);
        var trainDestinationDisplay = $("<td>").text(trainDestination);
        var trainFrequencyDisplay = $("<td>").text(trainFrequency);
        var trainNextTimeDisplay = $("<td>").text(trainArrivalTime);
        var trainMinutesDisplay = $("<td>").text(minutesAway);

        newRow.append(trainNameDisplay, trainDestinationDisplay, trainFrequencyDisplay, trainNextTimeDisplay, trainMinutesDisplay);
        $("#train-info").append(newRow);

        if (minutesAway <= 1) {

            newRow.addClass("table-info");

           /* $(".table-info").animate( { backgroundColor: "#f00" }, 2000 )
            .animate( { backgroundColor: "transparent" }, 2000 ); */

        }
        else if (minutesAway !== 1) { 
            newRow.removeClass("table-info");
        }
    });
}

function intervalSnapshot() {
    if (currentSnapshot !== null && currentSnapshot !== undefined) {
        displaySnapshot(currentSnapshot);
    }
}

database.ref("/trainTimeData").on("value", function (snapshot) {
    currentSnapshot = snapshot;

    if (intervalId === undefined) {
        setInterval(intervalSnapshot, 1000);
    }

    displaySnapshot(snapshot);
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

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

   /* if (trainFirstTime !== moment("HH:mm")) {
        $("#alert-wrapper").html("<div class='alert alert-danger' role='alert'>This is not a valid time!</div>");
    }*/
});

// Clear form
$("#submit").on("click", function (event) {
    $("#train-form")[0].reset();
});



