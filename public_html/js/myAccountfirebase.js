/* global firebase */

//BITNET\HitStudent
//Fall Access 2017
$.when(
        $.getScript("js/firebaseinit.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {

    $(document).ready(function () {

        var dbRef = firebase.database().ref('/');
        //Search and category datalists
        dbRef.child('user').once('child_added', setDashboard);

    });


    function getLevel(totalPoints) {
        var level = {
            level: 0,
            nexLevel: 0,
            color: '',
            tColor: ''

        };
        if (totalPoints < 20) {
            level.level = 1;
            level.nexLevel = 20;
            level.color = '#FFF';
            level.tColor = '#000';
        } else if (totalPoints > 19 && totalPoints < 76) {
            level.level = 2;
            level.nexLevel = 75;
            level.color = 'yellow';
            level.tColor = '#000';
        } else if (totalPoints > 75 && totalPoints < 151) {
            level.level = 3;
            level.nexLevel = 150;
            level.color = 'orange';
            level.tColor = '#000';
        } else if (totalPoints > 150 && totalPoints < 251) {
            level.level = 4;
            level.nexLevel = 250;
            level.color = 'green';
            level.tColor = '#FFF';
        } else if (totalPoints > 250 && totalPoints < 501) {
            level.level = 5;
            level.nexLevel = 500;
            level.color = 'blue';
            level.tColor = '#FFF';
        } else if (totalPoints > 500 && totalPoints < 1001) {
            level.level = 6;
            level.nexLevel = 1000;
            level.color = 'purple';
            level.tColor = '#FFF';
        } else if (totalPoints > 1000 && totalPoints < 2000) {
            level.level = 7;
            level.nexLevel = 2000;
            level.color = 'red';
            level.tColor = '#FFF';
        } else {
            level.level = 8;
            level.nexLevel = 'MAX';
            level.color = 'black';
            level.tColor = '#FFF';
        }
        return level;
    }

    function setDashboard() {

        var user = firebase.auth().currentUser;//get current user

        if (user) {

            var ref = firebase.database().ref("user");//get user objects ref
            /*find the user's table*/
            ref.orderByChild("uid").equalTo(user.uid).once("child_added", function (snapshot) {

                var user = snapshot.val();
                var totalPoints = 0;

                var pAdd = user.pAdd;
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
                    snapshot.ref.update({level: level.level, points: totalPoints});

                });

                var progressBar = '<div class="progress">' +
                        '<span class="glyphicon glyphicon-fire" aria-hidden="true" style="color:orange;"></span><div class="progress-bar" role="progressbar" aria-valuenow="' + totalPoints + '"' +
                        'aria-valuemin="0" aria-valuemax="' + level.nexLevel + '" style="width:' + ((totalPoints / level.nexLevel) * 100) + '%">' +
                        totalPoints + " / " + level.nexLevel +
                        '</div></div>';

                var levelBadge = '<span class="glyphicon glyphicon-certificate" aria-hidden="true" style="color: ' + level.color + '; font-size: 40px;"></span>';


                $('#totalPoints1').html(totalPoints);
                $('#level').html("<div class='badger' style='color:" + level.tColor + "; font-size: 20px;'>" + level.level + "</div>" + levelBadge);
                $('#pAdd').html("TOTAL: " + pAdd);
                $('#pAddPoints').html("POINTS ATTRIBUTED: " + pAddPoints + '<br><br><p><span class="glyphicon glyphicon-plus" aria-hidden="true" style="font-size: 30px;"></span></p>');
                $('#pEdit').html("TOTAL: " + pEdit);
                $('#pEditPoints').html("POINTS ATTRIBUTED: " + pEditPoints + '<br><br><p><span class="glyphicon glyphicon-wrench" aria-hidden="true" style="font-size: 30px;"></span></p>');
                $('#pFlags').html("TOTAL: " + pFlags);
                $('#pFlagsAgainst').html("TOTAL: " + pFlagsAgainst);
                $('#pRel').html(pRel);
                $('#prReview').html("TOTAL: " + pReview);
                $('#pReviewPoints').html("POINTS ATTRIBUTED: " + pReviewPoints + '<br><br><p><span class="glyphicon glyphicon-star" aria-hidden="true" style="font-size: 30px;"></span></p>');
                $('#rRel').html(reviewReliability);
                $('#nextLevel').html(progressBar + "Next Level @ " + level.nexLevel);
            });
        } else {

            location.href = "index.html";
        }

    }

});