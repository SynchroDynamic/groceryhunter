/* global firebase */

$.when(//Load firebase init
        $.getScript("js/firebaseinit.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {

    $(document).ready(function () {

        $("#myCarousel").carousel();
        /*Standard intial load of page events*/
        var dbRef = firebase.database().ref('/');
        dbRef.child('products').on('child_added', getProducts);


        $('#search').on('focus', function () {
            $("#myCarousel").slideUp(500);
            $('#listOfProducts').html('');
            $('#titleFor').html('Type To Search');
            $('#groupAlaBtn').animate({width: '100%'});
        });
        $('#search').on('blur', function () {
            $('#groupAlaBtn').animate({width: '120px'});
        });
        $('#searchclear').on('click', function(){
            $("#myCarousel").slideDown(500);
            $('#search').val('');
            $('#titleFor').html('Big Sales in Your Area');
            $('#listOfProducts').html('');
            var newRef = firebase.database().ref('/');
            newRef.child('products').on('child_added', getProducts);
            
        });

        /**
         * This an attempt at a firebase search. The event listeners cause multiple 
         * problems with making this more generic. If I have time I will revisit 
         * potential optimization.
         */
        var productRef = firebase.database().ref('/');
        $('#search').on('keyup paste', function () {
            searchProducts();
        });

        function searchProducts() {

            var searchQuery = $('#search').val().trim().toLowerCase();
            var percentOfSearchArray = [];
            $('#titleFor').html('Searching...' + searchQuery);

            productRef.child('products').on('child_added', function (snapshot) {

                $('#listOfProducts').html('');
                var product = snapshot.val();
                var compareProduct = product.productName;
                var lowerCompare = compareProduct.toLowerCase();
                var searchQuerySpaces = searchQuery.indexOf(' ');
                if (searchQuerySpaces >= 0) {
                    var splitSearchQuery = searchQuery.split(' ');
                    $.each(splitSearchQuery, function (index) {
                        var indexOfWord = lowerCompare.indexOf(splitSearchQuery[index]);
                        if (indexOfWord !== -1) {
                            var prices = product.productPrice;
                            function compare(a, b) {
                                if (a.price < b.price)
                                    return -1;
                                if (a.price > b.price)
                                    return 1;
                                return 0;
                            }
                            var storage = firebase.storage();
                            var storageRef = storage.ref();
                            storageRef.child('/productimages/' + product.productImage).getDownloadURL()
                                    .then(function (url) {
                                        prices.sort(compare);
                                        var div = '<div class="col-sm-4 listing" id="' + snapshot.key + '"><a href="?&page=product&id=' +
                                                snapshot.key + '">' +
                                                '<img src="' + url +
                                                '" class="img-responsive" style="width:100%; max-height: 200px;" alt="Image">' +
                                                '<p>' +
                                                product.productName + '</p><p>As Low as: $' + prices[0].price + '</p></a></div>';

                                        var divKey = findProductAlreadyFound(snapshot.key);
                                        function findProductAlreadyFound(divKey) {
                                            for (var i = 0, len = percentOfSearchArray.length; i < len; i++) {
                                                if (percentOfSearchArray[i].key === divKey)
                                                    return i; // Return as soon as the object is found
                                            }
                                            return -1; // The object was not found
                                        }


                                        if (divKey !== -1) {

                                            percentOfSearchArray[divKey].count += 1;


                                        } else {

                                            var foundProduct = {

                                                div: div,
                                                key: snapshot.key,
                                                count: 1

                                            };
                                            percentOfSearchArray.push(foundProduct);

                                        }
                                        var finalDivs = '';
                                        //alert(percentOfSearchArray.length);
                                        $.each(percentOfSearchArray, function (index) {
                                            var found = percentOfSearchArray[index];
                                            finalDivs += found.div;
                                        });
                                        $('#listOfProducts').html(finalDivs);


                                    });
                        }
                    });

                } else {
                    CheckAndPossiblePrintProduct(searchQuery, lowerCompare, product, snapshot.key)

                }

                percentOfSearchArray = [];

            });

        }

        function CheckAndPossiblePrintProduct(searchQuery, productNameToLower, product, key) {

            var indexOfWord = productNameToLower.indexOf(searchQuery);
            if (indexOfWord !== -1) {
                var prices = product.productPrice;
                function compare(a, b) {
                    if (a.price < b.price)
                        return -1;
                    if (a.price > b.price)
                        return 1;
                    return 0;
                }
                var storage = firebase.storage();
                var storageRef = storage.ref();
                storageRef.child('/productimages/' + product.productImage).getDownloadURL()
                        .then(function (url) {
                            prices.sort(compare);
                            var div = '<div class="col-sm-4 listing" id="' + key + '"><a href="?&page=product&id=' +
                                    key + '">' +
                                    '<img src="' + url +
                                    '" class="img-responsive" style="width:100%; max-height: 200px;" alt="Image">' +
                                    '<p>' +
                                    product.productName + '</p><p>As Low as: $' + prices[0].price + '</p></a></div>';

                            $('#listOfProducts').append(div);

                        });
            }


        }
    });
    /**
     * Posts all products to the index page
     * @param {firebase Object} snapshot 
     * @returns {undefined}
     */

    function getProducts(snapshot) {//Populate home page grid with products

        var products = snapshot.val();
        var imaga;
        var storage = firebase.storage();
        var storageRef = storage.ref();
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
                    var div = '<div class="col-sm-4 listing" id="' + snapshot.key + '"><a href="?&page=product&id=' +
                            snapshot.key + '"><img src="' + imaga +
                            '" class="img-responsive" style="width:100%; max-height: 200px;" alt="Image"><p>' +
                            products.productName + '</p><p>As Low as: $' + prices[0].price + '</p></a></div>';
                    $('#listOfProducts').append(div);
                });
    }//END getProducts



});