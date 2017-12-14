/* global firebase */

$.when(//Load firebase init
        $.getScript("js/firebaseinit.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {

    $(document).ready(function () {

        setTimeout(function () {
            var dbRef = firebase.database().ref('/');
            var user = firebase.auth().currentUser; //Get a user Reference

            dbRef.child('mylist').orderByChild('uid').equalTo(user.uid).once('child_added', function (snapshot) {

                var list = snapshot.val();
                var productIDs = list.productID;

                $.each(productIDs, function (index) {

                    dbRef.child('products').orderByKey().equalTo(productIDs[index]).once('child_added', function (childSnapshot) {
                        getMyList(childSnapshot);
                    });



                });


            });
        }, 1000);

    });
    var selectCount = 1;
    function getMyList(snapshot) {//Populate home page grid with products
        var products = snapshot.val();
        var imaga;
        var storage = firebase.storage();
        var storageRef = storage.ref();
        var user = firebase.auth().currentUser;
        storageRef.child('/productimages/' + products.productImage).getDownloadURL()
                .then(function (url) {
                    imaga = url;
                    var prices = products.productPrice;
                    function compare(a, b) {
                        if (a.price < b.price)
                            return -1;
                        if (a.price > b.price)
                            return 1;
                        return 0;
                    }

                    prices.sort(compare);
                    var div = '<tr id="' + snapshot.key + '">' +
                            '<th scope="row">' +
                            '<a href="?&page=product&id=' + snapshot.key + '"><img src="' + imaga + '"' +
                            'class="img-responsive" style=" width:100px; height:100px;" alt="Image"></a></th>';
                    div += '<td>' + products.productName + '<p><button type="button"' +
                            'class="btn btn-danger" id="removeItem' + snapshot.key + '">' +
                            '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button></p></td>' +
                            '<td><div class="form-group">' +
                            '<select class="form-control" id="priceOptions' + selectCount + '">';
                    $.each(prices, function (index) {
                        if (index === 0) {
                            div += '<option value="' + index + '" selected>' + prices[index].price + ' @' + prices[index].storeName + '</option>';
                        } else {
                            div += '<option value="' + index + '">' + prices[index].price + ' @' + prices[index].storeName + '</option>';
                        }


                    });


                    div += '</select><small id="Locality' + selectCount + '"></small>';
                    div += '<input type="hidden" id="proName' + selectCount + '" value="' + products.productName + '">' +
                            '</td></tr>';

                    $('#listOfProducts').append(div);
                    $('#removeItem' + snapshot.key).on('click', function () {
                        window.localStorage.removeItem(user.uid);
                        $('#startShop').attr('style', 'display: none');
                        snapshot.ref.remove();
                        $('#' + snapshot.key).attr('style', 'display: none');
                    });
                    setListeners(prices, selectCount);
                    selectCount += 1;

                });



    }//END getProducts
    function setListeners(prices, selectCount) {
        $('#Locality' + selectCount).text(prices[0].local);
        $('#priceOptions' + selectCount).on('change', function () {
            var priceIndex = $(this).val();
            $('#Locality' + selectCount).text(prices[priceIndex].local);
        });


        $('#startShopping').on('click', function () {
            var user = firebase.auth().currentUser;
            var myListArray = [];
            for (var j = 1; j <= selectCount; j++) {
                if (selectCount === 1) {
                } else {
                    var location = $('#Locality' + j).text();
                    var pName = $('#proName' + j).val();
                    var priceNstore = $('#priceOptions' + j).find(":selected").text();
                    var selectedParts = priceNstore.split('@');
                    var price = selectedParts[0].trim();
                    var store = selectedParts[1].trim();
                    var item = {
                        product: pName,
                        store: store,
                        price: price,
                        location: location
                    };
                    myListArray.push(item);
                }

            }
            window.localStorage.setItem(user.uid, JSON.stringify(myListArray));
            setInterval(function () {
                if (window.localStorage.getItem(user.uid) === null) {


                } else {

                    window.location.href = '?&page=startShopping';
                }

            }, 500);
        });


    }
});