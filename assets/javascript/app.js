$(document).ready(function () {


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

            var trainArrivalTime = trainNextMoment.format("HH:mm");
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

            var currentTimeDisplay = $(".currenttime").text(moment().format("HH:mm:ss"));

            if (minutesAway <= 1) {

                newRow.addClass("table-info");

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

        if (!moment(trainFirstTime, 'HH:mm').isValid()) {
            $("#time-wrapper").html("<div class='alert alert-danger' role='alert'>This is not a valid time!</div>");
            return false;
        } else {
            $("#time-wrapper").html("");

        }

        if (trainFrequency < 1) {
            $("#freq-wrapper").html("<div class='alert alert-danger' role='alert'>This is not a valid time!</div>");
            return false;
        } else {
            $("freq-wrapper").html("")
        }

        database.ref("/trainTimeData").push({
            trainName: trainName,
            trainDestination: trainDestination,
            trainFrequency: trainFrequency,
            trainFirstTime: trainFirstTime,
            dateAdded: firebase.database.ServerValue.TIMESTAMP
        });
        $("#train-form")[0].reset();

    });

    // Auth using a popup.

    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(firebase.auth());

    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                // User successfully signed in.
                // Return type determines whether we continue the redirect automatically
                // or whether we leave that to developer to handle.
                $('.modal').modal('hide');
                $(".footer").hide();
                return false;
            },
            signInSuccess: function (currentUser, credential, redirectUrl) {
                $('.modal').modal('hide');
                return false;
            },
            uiShown: function () {
                // The widget is rendered.
                // Hide the loader.
                $('.modal').modal({
                    backdrop: 'static',
                    keyboard: false
                });
                $(".footer").show();
                document.getElementById('loader').style.display = 'none';
            }
        },
        // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
        signInFlow: 'popup',
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,

            firebase.auth.GithubAuthProvider.PROVIDER_ID,

        ],
        // Terms of service url.
        //tosUrl: '<your-tos-url>'
    };

    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);













});