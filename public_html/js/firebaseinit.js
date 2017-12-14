
/* global firebase */

$(document).ready(function () {
    $(".ui-loader").hide();
    initFirebase();
    /***************************User authorization portion*********************************/

    $('#login').on('click', function () {

        var provider = new firebase.auth.GoogleAuthProvider();
        signin(provider);

    });

    function setUser() {
        //var currentUser = firebase.auth().currentUser;//get current user 
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                var dbRef = firebase.database().ref('/');
                dbRef.child('user').on('child_changed', setDashboard);
                dbRef.child('user').on('child_added', setDashboard);
                var ref = firebase.database().ref("user");
                ref.orderByChild("uid").equalTo(user.uid).on("child_added", function (snapshot) {
                    var userDetails = snapshot.val();
                    $('#totalPoints').html("<p class='navbar-text'><span class='glyphicon glyphicon-fire' aria-hidden='true' style='color:orange;'></span> " + userDetails.points + "</p>");
                    var myAccount = '<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"> ' +
                            '<img src="' + user.photoURL + '" style="height: 25px; border-radius: 50%;" /> ' + user.displayName + ' <span class="caret"></span></a>' +
                            '<ul class="dropdown-menu">' +
                            '<li><a href="?&page=myAccount"><span class="glyphicon glyphicon-user"></span> My Account</a></li>' +
                            '<li><a href="?&page=list"><span class="glyphicon glyphicon-cog"></span> Configure List</a></li>' +
                            '<li id="startShop"><a href="?&page=startShopping"><span class="glyphicon glyphicon-list-alt"></span> Go Shopping</a></li>' +
                            '<li><a href="?&page=add"><span class="glyphicon glyphicon-plus"></span> Add A Product</a></li>' +
                            '<li role="separator" class="divider"></li>' +
                            '<li id="login1"><a href="#"><span class="glyphicon glyphicon-off"></span> Logout?</a></li>' +
                            '</ul>';

                    $('#myaccount').html(myAccount);
                    $('#login').html('');
                    if (window.localStorage.getItem(user.uid) === null) {

                        $('#startShop').attr('style', 'display:none;');
                    }
                    $('#login1').on('click', function () {
                        var user = firebase.auth().currentUser;
                        if (user) {
                            firebase.auth().signOut();
                            location.href = '/';
                        }
                    });
                });



            } else {
                $('#totalPoint').html('');
                $('#myaccount').html('');
                $('#login').html('<a href="#"><span class="glyphicon glyphicon-log-in" ></span>Login</a>');
                if (location.href === "/Server/groceryhunter/?&page=myAccount") {
                    location.href = '/Server/groceryhunter/';
                }
            }
        });

    }

    function signin(provider) {//toggles login and logout functions with a popup

        firebase.auth().signInWithPopup(provider).then(function (result) {

            var token = result.credential.accessToken;
            var user = result.user;
//Find the user before you add them

            var account = {

                name: user.displayName,
                email: user.email,
                photoUrl: user.photoURL,
                emailVerified: user.emailVerified,
                uid: user.uid,
                points: 0,
                level: 1,
                thumbsTo: 0,
                thumbsFrom: 0,
                pAdd: 0,
                pEdit: 0,
                pReview: 0,
                medal: 0

            };



            var ref = firebase.database().ref("user");
            var userSet = 0;

            ref.orderByChild("uid").equalTo(user.uid).on("child_added", function (snapshot) {
                userSet = 1;
            });
            setTimeout(function () {
                if (userSet === 0) {
                    var dbRef = firebase.database().ref("/");
                    dbRef.child('user').push(account);
                }
            }, 2000);
            console.log('signed IN');
        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
            console.log(errorCode);
            console.log(errorMessage);
            console.log(email);
            console.log(credential);
        });

    }

    function initFirebase() {//start firebase


// Initialize Firebase
        var config = {
            apiKey: "AIzaSyDePVoyI96tUeBV8gkNw-Od8iysXab5yng",
            authDomain: "groceryhunter-566f6.firebaseapp.com",
            databaseURL: "https://groceryhunter-566f6.firebaseio.com",
            projectId: "groceryhunter-566f6",
            storageBucket: "groceryhunter-566f6.appspot.com",
            messagingSenderId: "713368578645"
        };
        firebase.initializeApp(config);
        var dbRef = firebase.database().ref('/');
        dbRef.child('user').on('child_changed', setUser);
        dbRef.child('user').on('child_added', setUser);


    }

    function getLevel(totalPoints) {
        var level = 0;
        if (totalPoints < 20) {
            level = 1;
        } else if (totalPoints > 19 && totalPoints < 76) {
            level = 2;
        } else if (totalPoints > 75 && totalPoints < 151) {

            level = 3;
        } else if (totalPoints > 150 && totalPoints < 251) {

            level = 4;
        } else if (totalPoints > 250 && totalPoints < 501) {

            level = 5;
        } else if (totalPoints > 500 && totalPoints < 1001) {

            level = 6;
        } else if (totalPoints > 1000 && totalPoints < 2000) {

            level = 7;
        } else {
            level = 7;
        }
        return level;
    }

    function setDashboard() {
        var user = firebase.auth().currentUser;//get current user
        var ref = firebase.database().ref("user");//get user objects ref
        /*find the user's table*/
        ref.orderByChild("uid").equalTo(user.uid).on("child_added", function (snapshot) {

            var user = snapshot.val();
            var totalPoints = 0;
            var pAddPoints = parseInt(user.pAdd) * 10;

            var pEdit = user.pEdit;
            var pEditPoints = parseInt(pEdit) * 2;
            var pFlags = (typeof user.pFlags === 'undefined') ? 0 : parseInt(user.pFlags);
            var pFlagsAgainst = (typeof user.pFlagsAgainst === 'undefined') ? 0 : (parseInt(user.pFlagsAgainst) * 2);

            var pRel = (typeof user.reliability === 'undefined') ? 0 : parseInt(user.reliability);
            var pReview = (typeof user.pReview === 'undefined') ? 0 : parseInt(user.pReview);
            var reviewReliability = (typeof user.reviewReliability === 'undefined') ? 0 : parseInt(user.reviewReliability);
            var pReviewPoints = pReview * 10;

            totalPoints = ((pAddPoints + pEditPoints + pFlags + pRel + pReviewPoints + reviewReliability) - pFlagsAgainst);
            var level = getLevel(totalPoints);
            var ref = firebase.database().ref("user");
            ref.orderByChild("uid").equalTo(user.uid).on("child_added", function (snapshot) {
                snapshot.ref.update({level: level, points: totalPoints});

            });
        });


    }

    /**
     * 
     * @param {type} name Current User's displayName from Firebase
     * @param {type} message feedback from points acheived 
     * @param {type} reason the reason the user received the points
     * @returns a popup message for the user to see their contribution
     */

    function modalMessaging(name, message, reason) {

        $('#feedbackTitle').html("<h4>Hey Hey... " + name + "</h4>");
        $('#feedbackMessage').html("<p class='col-sm-6'><img src='img/kudos.png' style='max-height: 200px;'></p>" +
                "<p class='col-sm-6'><h5>" + message + "</h5><h4><small>" + reason + "</small></h4></p>");
        $("#exampleModal").modal("show");
        $("html, body").animate({scrollTop: 0}, "slow");


    }
    
});