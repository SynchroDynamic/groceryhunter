/* global firebase */

$.when(//Load firebase init
        $.getScript("js/firebaseinit.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {

    $(document).ready(function () {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                buildList(user);
            } else {
            }
        });

    });

    setTimeout(function () {

        $("label").on("click", function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            crossItemOut(this);
        });

        
        $('.checkbox').on('click', function(){
            
            var label = $(this).find('label');
            crossItemOut(label);
            
        });

    }, 1000);

    function crossItemOut(words) {
        var checked = $(words).attr("data-c");
        if (checked === 's') {
            $(words).attr("style", "text-decoration:none");
            $(words).attr("data-c", "n");
            $(words).parent('div').find('input:checkbox').prop('checked', false);
        } else {
            $(words).attr("style", "text-decoration:line-through");
            $(words).attr("data-c", "s");
            $(words).parent('div').find('input:checkbox').prop('checked', true);
        }

    }

    function buildList(user) {
        var uid = user.uid;
        var shopArray = $.parseJSON(window.localStorage.getItem(uid));
        var sortedList = shopArray.sort(compareList);

        var firstStore = '';
        var output = '<h3>Your Grocery List</h3>';
        //build ul's

        for (var i = 0; i < shopArray.length; i++) {
            if (sortedList[i].store === firstStore) {
                output += '<li><div class="checkbox"><input type="checkbox" id="checkbox" value=""><label data-c="n">' + sortedList[i].product + '</label>' +
                        '<p style="float:right;">$' + sortedList[i].price + '</p></div></li>';
            } else {
                output += '</ul></div></div>';
                firstStore = sortedList[i].store;
                output += '<div class="panel panel-default">' +
                        '<div class="panel-heading">' +
                        '<h4 class="panel-title">' +
                        '<a data-toggle="collapse" data-parent="#accordion" href="#collapse' + i + '">' + sortedList[i].store +
                        '</a><a href="https://www.google.com/maps/place/' + sortedList[i].location + '" style="float:right;">' +
                        '<span class="glyphicon glyphicon-map-marker" aria-hidden="true" style="font-size: 20px; color:#FA8258;"></span> ' +
                        sortedList[i].location + '</a>' +
                        '</h4>' +
                        '</div>' +
                        '<div id="collapse' + i + '" class="panel-collapse collapse">' +
                        '<div class="panel-body">';

                output += '<ul><li><div class="checkbox"><input type="checkbox" value=""><label data-c="n">' +
                        sortedList[i].product + '</label><p style="float:right;">$' + sortedList[i].price + '</p></div></li>';
            }
            if (i === shopArray.length - 1) {
                output += '</div></div>';
            }

        }

        $('.shoppingList').html(output);

    }

    function compareList(a, b) {//price sort ascending
        if (a.storeName < b.storeName)
            return -1;
        if (a.storeName > b.storeName)
            return 1;
        return 0;
    }
});