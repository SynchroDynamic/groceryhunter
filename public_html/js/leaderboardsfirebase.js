/* global firebase */

$.when(//Load firebase init
        $.getScript("js/firebaseinit.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {

    $(document).ready(function () {
        /*Each leaderBoard needs its own Firebase Reference*/
        var points, review, reliable;

        /*Store Sets of Users Here*/
        var superShopperList = [];
        var topReviews = [];
        var topReliable = [];
        /*Store Sets End*/

        getTop10WithNameAndOneVariable(points, 'points', 'user', superShopperList, 'supershoppers');
        getTop10WithNameAndOneVariable(review, 'pReview', 'user', topReviews, 'topReviews');
        getTop10WithNameAndOneVariable(reliable, 'reliability', 'user', topReliable, 'topReliable');

        function getTop10WithNameAndOneVariable(instance, orderBy, table, pushToArray, addTo) {

            instance = firebase.database().ref(table);
            instance.orderByChild(orderBy).limitToLast(10).on('child_added', function (snapshot) {
                buildObjectByNameAndOneVariable(snapshot, orderBy, pushToArray, addTo);
            });
            instance.orderByChild(orderBy).limitToLast(10).on('child_changed', function (snapshot) {
                buildObjectByNameAndOneVariableChange(snapshot, orderBy, pushToArray, addTo);
            });

        }

        function buildObjectByNameAndOneVariableChange(snapshot, get, pushToArray, addTo) {

            var user = snapshot.val();
            var points = user[get];
            var shopper = {
                points: points,
                name: user.name
            };            
            for (var i = 0; i < pushToArray.length; i++) {
                if (pushToArray[i].name === user.name) {
                    pushToArray.splice(i, 1);
                }
            }

            pushToArray.push(shopper);


            buildLeaderBoard(addTo, pushToArray);

        }

        function buildObjectByNameAndOneVariable(snapshot, get, pushToArray, addTo) {

            var user = snapshot.val();
            var points = user[get];
            var shopper = {
                points: points,
                name: user.name
            };
            pushToArray.push(shopper);
            buildLeaderBoard(addTo, pushToArray);

        }


        function buildLeaderBoard(addTo, pushToArray) {
            var count = 1;
            var output = "";
            function compare(a, b) {//price sort ascending
                if (a.points < b.points)
                    return 1;
                if (a.points > b.points)
                    return -1;
                return 0;
            }
            pushToArray.sort(compare);
            $.each(pushToArray, function (index) {
                var listItem = "";
                if (index === 0) {
                    listItem += "<tr style='border: 3px solid #DAA520;font-size: 15px;'>";
                    listItem += '<th scope="row"><img src="img/gold.png" alt="" style="width: 25px;height: 25px;"/></th>';
                } else if (index === 1) {
                    listItem += "<tr style='border: 3px solid #A9A9A9;font-size: 15px;'>";
                    listItem += '<th scope="row"><img src="img/silver.png" alt="" style="width: 25px;height: 25px;"/></th>';
                } else if (index === 2) {
                    listItem += "<tr style='border: 3px solid #A67D3D;font-size: 15px;'>";
                    listItem += '<th scope="row"><img src="img/bronze.png" alt="" style="width: 25px;height: 25px;"/></th>';
                } else {
                    listItem += "<tr style='font-size: 10px;'>";
                    listItem += '<th scope="row">' + count + '</th>';

                }


                listItem += '<td>' + pushToArray[index].name + '</td>';
                listItem += '<td>' + pushToArray[index].points + '</td></tr>';

                output += listItem;
                count += 1;
            });
            $('#' + addTo).html(output);
        }

    });
});


