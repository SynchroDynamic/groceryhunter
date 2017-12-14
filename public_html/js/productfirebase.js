/* global firebase, CKEDITOR */

var reviewTotal = 0;
var reviewCount = 0;

$.when(//Load firebase init
        $.getScript("js/firebaseinit.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {

    $(document).ready(function () {
        $('.addPop').hide(0);
        /*********************************************SET FIREBASE LISTENERS FOR DATABASE CHANGES*/
        var dbRef = firebase.database().ref('/');
        dbRef.child('products').on('child_changed', productPage);
        dbRef.child('products').on('child_added', productPage);
        var reviews = firebase.database().ref("reviews");
        reviews.orderByChild("productId").once("child_added", getReviews).then(function (snapshot) {
            reviewListeners();
        });
        reviews.orderByChild("productId").on("child_changed", function (snapshot) {
            var review = snapshot.val();
            var check = parseInt(review.reliability);
            if (check === -10) {
                snapshot.ref.remove();
                $('#' + snapshot.key).parent('div').parent('div').html('');
            } else {
                $('#' + snapshot.key).html(review.reliability);
            }
        });
        function getReviews(snapshot) {
            var reviewList = "";
            reviewTotal = 0;
            reviewCount = 0;
            var reviews = firebase.database().ref("reviews");
            reviews.orderByChild("productId").on("child_added", function (snapshot) {
                var pick_ = getParameter("id"); //Get the product ID from url
                var review = snapshot.val();
                if (review.productId === pick_) {
                    reviewTotal += parseInt(review.rating);
                    reviewCount += 1;
                    var formatReview = getFormattedReview(review.title, review.body, review.rating, review.userName, review.uid, reviewCount, snapshot.key, review.reliability);
                    reviewList += formatReview;
                    $('#pReviews').html(reviewList);
                }
            });
        }

        /********************************************************ADD A PRICE TO EXISTING PRODUCT*/
        $('#priceAdd').on('click', function () {

            e.preventDefault();
            var user = firebase.auth().currentUser;
            var userId = user.uid;
            var price = $('#price').val();
            var storeName = $('#pStore').val();
            var local = $('#pLocation').val();
            var pick_ = getParameter("id");
            var productList = {price, storeName, local, userId};
            var productRef = firebase.database().ref('products');
            productRef.orderByKey().equalTo(pick_).on("child_added", function (snapshot) {
                var product = snapshot.val();
                if (product === null) {
                    /* does not exist */
                } else {


                    var productArray = [];
                    var p = product.productPrice;
                    $.each(p, function (index) {
                        if (typeof p[index].price === 'undefined') {
                        } else {
                            var price = p[index].price;
                            var storeName = p[index].storeName;
                            var local = p[index].local;
                            var userId = p[index].userId;
                            var pItem = {price, storeName, local, userId};
                            productArray.push(pItem);
                        }
                    });
                    productArray.push(productList);
                    firebase.database().ref().child('/products/' + pick_)
                            .update({productPrice: productArray});
                }
                var user = firebase.auth().currentUser;
                var ref = firebase.database().ref("user");
                ref.orderByChild("uid").equalTo(user.uid).on("child_added", function (snapshot) {

                    var user = snapshot.val();
                    var addPoints = parseInt(user.pEdit) + 1;
                    snapshot.ref.update({pEdit: addPoints}); /*****************************************USER AWARD*/
                    modalMessaging(user.name, "You got 2 Points!", "FOR: Adding a new Address to a product");
                });
            });
            $('#price').val('');
            $('#pStore').val('');
            $('#pLocation').val('');
        });
        $('#addReview').on('click', function () {

            var user = firebase.auth().currentUser;
            var pick_ = getParameter("id"); //Get the product ID from url
            var body = CKEDITOR.instances['content'].getData();
            var review = {
                rating: $('#rating').val(),
                title: $('#title').val(),
                body: body,
                uid: user.uid,
                userName: user.displayName,
                productId: pick_
            };
            var reviewRef = firebase.database().ref('reviews');
            reviewRef.push(review);
            var userRef = firebase.database().ref('user');
            userRef.orderByChild('uid').equalTo(user.uid).once('child_added', function (snapshot) {
                var user = snapshot.val();
                var currentRel = (typeof user.pReview === 'undefined') ? 0 : parseInt(user.pReview);
                var rel = currentRel + 1;
                snapshot.ref.update({pReview: rel});
                modalMessaging(user.name, "You got 10 Points!", "FOR: Writing a Product Review");
            });
            $('#starRating1').css('starRating');
            $('#starRating2').css('starRating');
            $('#starRating3').css('starRating');
            $('#starRating4').css('starRating');
            $('#starRating5').css('starRating');
            $('#title').val('');
            $('#content').val('');
            return false;
        });
    }); //end doc.ready


    /*************************************CALL FUNCTIONS****************************************/

    /**
     * This function build an individual product page.
     * 
     */

    function productPage() {//All in one function to run an individual product page
        var pick_ = getParameter("id"); //Get the product ID from url
        if (pick_ === '' || pick_ === 1) {
        } else {
            /*Get a product Reference*/
            var productRef = firebase.database().ref('products');
            /*find the product that matches the key from url*/
            productRef.orderByKey().equalTo(pick_).on("child_added", function (snapshot) {
                var product = snapshot.val(); //get the product
                /*************************INITIAL BUILD PRODUCT PAGE************************************/
                var poorProduct = product.deleteIt;
                var poorCount = (typeof poorProduct === 'undefined') ? 0 : poorProduct.length;
                var pName = "<h2>" + product.productName +
                        " <small><button type='button' class='btn btn-danger' id='poorProduct'>" +
                        "<span class='glyphicon glyphicon-trash' aria-hidden='true'></span></button> >> Votes " + poorCount + "/10</small></h2>";
                $('#pName').html(pName); //Set Header
                /*Get a storage Referece for images*/
                setOneImageFromStorage('productimages', product.productImage, 'pImage');
                /*Build Desctiption HTML*/
                var pDescription = "<h3>Description</h3> <div id='displayEdit'></div>" +
                        "<div id='startEdit'></div><p id='pD'>" + product.productDescription + "</p>";
                $('#pDescription').html(pDescription); //Add description to Div
                /*build Initial Author*/
                var pAuthor = "<h5>First added by: " + product.productAuthorName + "</h5>";
                $('#pAuthor').html(pAuthor); //Add Author to Div
                var prices = product.productPrice; //Product has many prices. set into var
                var setPrices = []; //Set another array to track its original index                
                $.each(prices, function (index) {//Build a new reference to the array                    
                    setPrices.push(prices[index]);
                });
                prices.sort(comparePrice); //sort the prices   

                //addToMyList


                /**
                 * 
                 * @type String Excepts a function which returns a concatnated String
                 * of tablerows of prices which are then passed to the page for viewing
                 */

                var listItem = buildProductPagePriceList(setPrices, prices, snapshot.key);
                $('#pPrice').html(listItem); //Set all rows to table                                  


                userAccessSettings(); //Sets page settings based on access level
                var user = firebase.auth().currentUser; //Get a user Reference


                var value = {
                    
                    exists: function(){}
                    
                }






                $('#addToMyList').off().on('click', function (e) {

                    var listRef = firebase.database().ref('mylist');
                    listRef.once('value', function (allSnapshot) {
                        console.log(allSnapshot);
                        var exists = false;
                        if (!allSnapshot.exists()) {
                            var productID = snapshot.key;
                            var newUserList = {

                                uid: user.uid,
                                productID: [productID]

                            };
                            listRef.push(newUserList);
                        } else {

                            allSnapshot.forEach(function (childSnapshot) {
                                var childKey = childSnapshot.key;
                                var childData = childSnapshot.val();
                                if (childData.uid === user.uid) {
                                    exists = true;
                                }
                                if (exists) {
                                    listRef.orderByChild('uid').equalTo(user.uid).once('child_added', function (uniqueSnapshot) {
                                        const list = uniqueSnapshot.val();
                                        if (list.uid === user.uid) {
                                            var badPop = false;
                                            var productIDs = list.productID;
                                            var newProIDs = [];
                                            var productID = snapshot.key;
                                            $.each(productIDs, function (index) {
                                                if (productIDs[index] === productID) {
                                                    badPop = true;
                                                } else {
                                                    newProIDs.push(productIDs[index]);

                                                }
                                            });
                                            if (badPop) {
                                                $('.addPop').attr('style', 'background: red; color: white');
                                                $('.addPop').html('<h4>You have already added this product</h4> <img height="35" src="img/kudos.png" alt="" style="display: inline-block;"/>');
                                                $('.addPop').slideDown(1000, function () {
                                                }).delay(1500);
                                                $('.addPop').hide('explode', {pieces: 512}, 2000);

                                            } else {
                                                $('.addPop').slideDown(1000, function () {
                                                }).delay(1500);
                                                $('.addPop').hide('explode', {pieces: 512}, 2000);
                                                $('#startShop').attr('style', 'display: none');
                                            }
                                            var addIt = productID;
                                            newProIDs.push(addIt);
                                            //firebase.database().ref('mylist/' + childSnapshot.key).update({productID: newProIDs});
                                            uniqueSnapshot.ref.update({productID: newProIDs});

                                        }

                                    });

                                } else {

                                    var productID = snapshot.key;
                                    var newUserList = {

                                        uid: user.uid,
                                        productID: [productID]

                                    };
                                    listRef.push(newUserList);
                                }


                            });



                        }
                    });

                });

                /*On description's edit button click, load ckEditor*/
                $('#deditable').on('click', function () {
                    $('#pD').html('');
                    $('#startEdit').html('<div class="form-group"><label for="editD">Edit Description</label>' +
                            '<textarea class="form-control" rows="5" id="editD">' + product.productDescription + '</textarea></div>' +
                            '<button type="button" class="btn btn-success" id="submitEdit">Save Edit</button>');
                    CKEDITOR.replace('editD'); //Replace text area with ckeditor instance
                    /*submit edits and post newly edited description*/
                    $('#submitEdit').on('click', function () {
                        var date = new Date();
                        var datePart = date.toDateString();
                        var timePart = date.toLocaleTimeString();
                        var dateTime = datePart + " " + timePart;
                        var edit = {
                            editedBy: user.uid,
                            productName: product.productName,
                            productKey: snapshot.key,
                            dateEdited: dateTime
                        };
                        var editRef = firebase.database().ref('productEdits');
                        editRef.push(edit);
                        var des = CKEDITOR.instances['editD'].getData();
                        snapshot.ref.update({productDescription: des});
                        var pDescription = "<h3>Description</h3> <div id='displayEdit'><small>Thank you for your edit " + user.displayName + "</small></div>" +
                                "<div id='startEdit'></div><p id='pD'>" + des + "</p>";
                        $('#pDescription').html(pDescription);
                        var ref = firebase.database().ref("user");
                        ref.orderByChild("uid").equalTo(user.uid).on("child_added", function (snapshot) {
                            var user = snapshot.val();
                            var addPoints = parseInt(user.pEdit) + 1;
                            snapshot.ref.update({pEdit: addPoints}); /*****************************************USER AWARD*/
                            modalMessaging(user.name, "You got 2 Points!", "FOR: Editing a product desciption");
                        });
                    });
                });
            });
        }
        $('#poorProduct').off().on('click', function () {
            var productRef = firebase.database().ref('products');
            var ref = firebase.database().ref("user");
            var user = firebase.auth().currentUser; //Get a user Reference
            var powerUser = false;
            var userRef = firebase.database().ref('user');
            userRef.orderByChild('uid').equalTo(user.uid).once('child_added', function (snapshot) {

                var user = snapshot.val();
                var level = user.level;
                if (level > 6) {
                    powerUser = true;

                }

                /*find the product that matches the key from url*/
                productRef.orderByKey().equalTo(pick_).limitToFirst(1).once("child_added", function (snapshot) {
                    var product = snapshot.val();
                    var deleteable = product.deleteIt;
                    if (powerUser) {//user is a level 7 or above they have single delete power
                        deleteable.push({user: user.uid});
                        $.each(deleteable, function (index) {

                            ref.orderByChild("uid").equalTo(deleteable[index].user).on("child_added", function (snapshot) {
                                var user = snapshot.val();
                                var pFlags = (typeof user.pFlags === 'undefined') ? 0 : user.pFlags;
                                var addPoints = parseInt(pFlags) + 1;
                                snapshot.ref.update({pFlags: addPoints});
                            });
                        });
                        var storageRef = firebase.storage().ref('/productimages/' + product.productImage);
                        storageRef.delete();
                        snapshot.ref.remove();
                        setTimeout(function () {
                            location.href = 'index.html';
                        }, 1000);

                    } else if (deleteable) {

                        ref.orderByChild("email").equalTo(product.productAuthorEmail).on("child_added", function (snapshot) {
                            var badUser = snapshot.val();
                            var pFlagsAgainst = (typeof badUser.pFlagsAgainst === 'undefined') ? 0 : badUser.pFlagsAgainst;
                            var flag = parseInt(pFlagsAgainst) + 1;
                            snapshot.ref.update({pFlagsAgainst: flag});
                        });
                        if (deleteable.length > 0) {


                            if (deleteable.length === 9) {
                                deleteable.push({user: user.uid});
                                $.each(deleteable, function (index) {

                                    ref.orderByChild("uid").equalTo(deleteable[index].user).on("child_added", function (snapshot) {
                                        var user = snapshot.val();
                                        var pFlags = (typeof user.pFlags === 'undefined') ? 0 : user.pFlags;
                                        var addPoints = parseInt(pFlags) + 1;
                                        snapshot.ref.update({pFlags: addPoints});
                                    });
                                });
                                var storageRef = firebase.storage().ref('/productimages/' + product.productImage);
                                storageRef.delete();
                                snapshot.ref.remove();
                                setTimeout(function () {
                                    location.href = 'index.html';
                                }, 1000);
                            } else {
                                var currentDeleteable = {user: user.uid};
                                deleteable.push(currentDeleteable);
                                snapshot.ref.update({deleteIt: deleteable});
                            }
                        } else {
                            var deleteIt = [{user: user.uid}];
                            snapshot.ref.update(deleteIt);
                        }
                    } else {
                        ref.orderByChild("email").equalTo(product.productAuthorEmail).on("child_added", function (snapshot) {
                            var badUser = snapshot.val();
                            var pFlagsAgainst = (typeof badUser.pFlagsAgainst === 'undefined') ? 0 : badUser.pFlagsAgainst;
                            var flag = parseInt(pFlagsAgainst) + 1;
                            snapshot.ref.update({pFlagsAgainst: flag});
                        });
                        var deleteIt = [{user: user.uid}];
                        snapshot.ref.update({deleteIt: deleteIt});
                    }
                });
            });
        });
        $('#pPrice  > tr').each(function (index) {
            $('#goodPrice' + index).off().on('click', function () {
                var place = $(this).attr('data-place');
                var uid = $(this).attr('data-uid');
                var key = $(this).attr('data-key');
                var productRef = firebase.database().ref('products');
                productRef.orderByKey().equalTo(key).limitToFirst(1).once("child_added", function (snapshot) {
                    var product = snapshot.val();
                    var productRel = product.productPrice[place].reliability;
                    var currentRel = (typeof productRel === 'undefined') ? 0 : parseInt(productRel);
                    var reliability = currentRel + 1;
                    snapshot.ref.child('productPrice').child(place).update({reliability: reliability});
                });
                var userRef = firebase.database().ref('user');
                userRef.orderByChild('uid').equalTo(uid).once('child_added', function (snapshot) {

                    var user = snapshot.val();
                    var currentRel = (typeof user.reliability === 'undefined') ? 0 : parseInt(user.reliability);
                    var rel = currentRel + 1;
                    snapshot.ref.update({reliability: rel});
                });
            });
            $('#badPrice' + index).off().on('click', function () {
                var place = $(this).attr('data-place');
                var uid = $(this).attr('data-uid');
                var key = $(this).attr('data-key');
                var productRef = firebase.database().ref('products');
                productRef.orderByKey().equalTo(key).limitToFirst(1).once("child_added", function (snapshot) {
                    var product = snapshot.val();
                    var productRel = product.productPrice[place].reliability;
                    var currentRel = (typeof productRel === 'undefined') ? 0 : parseInt(productRel);
                    if (currentRel === -4) {
                        snapshot.ref.child('productPrice').child(place).child('price').remove();
                    } else {
                        var reliability = currentRel - 1;
                        snapshot.ref.child('productPrice').child(place).update({reliability: reliability});
                    }
                });
                var userRef = firebase.database().ref('user');
                userRef.orderByChild('uid').equalTo(uid).once('child_added', function (snapshot) {

                    var user = snapshot.val();
                    var currentRel = (typeof user.reliability === 'undefined') ? 0 : parseInt(user.reliability);
                    var rel = currentRel - 1;
                    snapshot.ref.update({reliability: rel});
                });
            });
        });
    }//END PRODUCT PAGE

    /**
     * 
     * @param {type} name url parameter to look for
     * @param {type} url the current url 
     * @returns {Number|String} Returns the value from the key of the url
     */

    function getParameter(name, url) {//We can then return the URL like this
        if (!url)
            url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
        if (!results)
            return 1; //if no parameters return the first option
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }//END getParameter

    /**
     * This function is currently not used. Its function is to set a key=value
     * to a url
     * @param {type} key
     * @param {type} value
     * @returns {undefined}
     */

    function setSelectValue(key, value) {//We can set a Parameter in our URL like this
        key = encodeURI(key);
        value = encodeURI(value);
        var kvp = document.location.search.substr(1).split('&');
        var i = kvp.length;
        var x;
        while (i--)//
        {
            x = kvp[i].split('=');
            if (x[0] === key)
            {
                x[1] = value;
                kvp[i] = x.join('=');
                break;
            }
        }
        if (i < 0) {
            kvp[kvp.length] = [key, value].join('=');
        }
        document.location.search = kvp.join('&');
    }//END setSelectValue

    /**
     * A function that puts product reviews together
     * @param {string} title  | the user's review title
     * @param {string} body   | The user's review content
     * @param {string} rating | string parsable to number value out of 5 
     *                        | given to the product which was reviewd
     * @param {type} userName | name of the reviewer
     * @param {type} uid      | reviewer's unique id
     * @param {type} index    | Review location in order
     * @param {type} key      | Objects ID
     * @param {type} rel      | string parsable to number which indicates reliability
     * @returns {String}      | a single review
     */

    function getFormattedReview(title, body, rating, userName, uid, index, key, rel) {
        var reviewAvg = parseInt(reviewTotal / reviewCount);
        var currentRel = (typeof rel === 'undefined') ? 0 : rel;
        var avgStars = "<p>Average Rating</p>";
        for (var i = 0; i <= reviewAvg; i++)
        {
            if (reviewAvg === 0)
            {
                avgStars += '<div style="display: inline-block;">Not Reviewed Yet</div>';
            } else if (reviewAvg > 0 && i < reviewAvg)
            {
                avgStars += '<img width="20px" style="margin-top: -3px;" src="img/star.png" />';
                if (i === reviewAvg - 1)
                {
                    for (var j = reviewAvg; j < 5; j++) {
                        avgStars += '<img width="20px" style="margin-top: -3px;" src="img/starNotSelected.png" />';
                    }
                }
            }
        }
        avgStars += "<p>" + reviewAvg + "/5" + "</p>";
        $('#reviewAVG').html(avgStars);
        var html = "<div class='userReview'><h3>" + title + "</h3>";
        html += "<p>Review By: " + userName + "</p>";
        for (var i = 0; i <= rating; i++)
        {
            if (rating === 0)
            {
                html += '<div style="display: inline-block;">Not Reviewed Yet</div>';
            } else if (rating > 0 && i < rating)
            {
                html += '<img width="20px" style="margin-top: -3px;" src="img/star.png" />';
                if (i === rating - 1)
                {
                    for (var j = rating; j < 5; j++) {
                        html += '<img width="20px" style="margin-top: -3px;" src="img/starNotSelected.png" />';
                    }
                }
            }
        }
        html += body;
        html += "<div id='helpful'><p id='" + key + "'>" + currentRel + "</p>";
        html += '<button type="button" class="btn btn-success" id="goodReview' + index + '" data-place="' + index + '"' +
                ' data-uid="' + uid + '" data-key="' + key + '"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span></button> ' +
                '<button type="button" class="btn btn-danger" id="badReview' + index + '" data-place="' + index + '"' +
                ' data-uid="' + uid + '" data-key="' + key + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>';
        html += "</div></div>";
        return html;
    }

    /**
     * 
     * Runs multiple functions when a firebase listener fires
     */

    function reviewListeners() {
        $('#pReviews > div').each(function (index) {

            var trueIndex = index + 1;
            $('#goodReview' + trueIndex).off().on('click', function () {
                var place = $(this).attr('data-place');
                var uid = $(this).attr('data-uid');
                var key = $(this).attr('data-key');
                var reviewRef = firebase.database().ref('reviews');
                reviewRef.orderByKey().equalTo(key).limitToFirst(1).once("child_added", function (snapshot) {
                    var review = snapshot.val();
                    var reviewRel = review.reliability;
                    var currentRel = (typeof reviewRel === 'undefined') ? 0 : parseInt(reviewRel);
                    var reliability = currentRel + 1;
                    snapshot.ref.update({reliability: reliability});
                });
                var userRef = firebase.database().ref('user');
                userRef.orderByChild('uid').equalTo(uid).once('child_added', function (snapshot) {

                    var user = snapshot.val();
                    var currentRel = (typeof user.reviewReliability === 'undefined') ? 0 : parseInt(user.reviewReliability);
                    var rel = currentRel + 1;
                    snapshot.ref.update({reviewReliability: rel});
                });
            });
            $('#badReview' + trueIndex).off().on('click', function () {
                var place = $(this).attr('data-place');
                var uid = $(this).attr('data-uid');
                var key = $(this).attr('data-key');
                var reviewRef = firebase.database().ref('reviews');
                reviewRef.orderByKey().equalTo(key).limitToFirst(1).once("child_added", function (snapshot) {
                    var review = snapshot.val();
                    var reviewRel = review.reliability;
                    var currentRel = (typeof reviewRel === 'undefined') ? 0 : parseInt(reviewRel);
                    var reliability = currentRel - 1;
                    snapshot.ref.update({reliability: reliability});
                });
                var userRef = firebase.database().ref('user');
                userRef.orderByChild('uid').equalTo(uid).once('child_added', function (snapshot) {

                    var user = snapshot.val();
                    var currentRel = (typeof user.reviewReliability === 'undefined') ? 0 : parseInt(user.reviewReliability);
                    var rel = currentRel - 1;
                    snapshot.ref.update({reviewReliability: rel});
                });
            });
        });
    }

    /**
     * finds and sends a single image to an html location from firebase storage
     * @param {string} fileLocation the folder where the image is located
     * @param {string} fileName the image's file name
     * @param {string} addTo The id of the element to add the image to
     * 
     */

    function setOneImageFromStorage(fileLocation, fileName, addTo) {
        var storage = firebase.storage();
        var storageRef = storage.ref();
        /*Get the image from the stored image url*/
        storageRef.child('/' + fileLocation + '/' + fileName).getDownloadURL()
                .then(function (url) {
                    /*Build the Image HTML*/
                    var div = '<img src="' + url +
                            '" class="img-responsive" style="max-height: 400px;" alt="Image">';
                    $('#' + addTo).html(div); // Add image to div
                    return div;
                });
    }

    /**
     * A function that concatnates a table row list of prices together for a single 
     * product
     * @param {type} originalArray | the original locations of the prices as they are in firebase
     * @param {type} sortedArray   | a similar array to orignalArray
     * @param {type} key           | product key
     * @returns {String}           | returns all tr for product price list
     */

    function buildProductPagePriceList(originalArray, sortedArray, key) {
        var listItem = "";
        /*build HTML For each price table row*/
        $.each(sortedArray, function (index) {
            /*Find the original array position*/
            if (typeof sortedArray[index].price === 'undefined') {
            } else {
                var originalIndex = originalArray.findIndex(x => x.price === sortedArray[index].price && x.storeName === sortedArray[index].storeName && x.local === sortedArray[index].local && x.userId === sortedArray[index].userId);
                var currentRel = (typeof sortedArray[index].reliability === 'undefined') ? 0 : sortedArray[index].reliability;
                var tr = '<tr><th id="' + key + '" scope="row">$' + sortedArray[index].price + '</th>' +
                        '<td>' + sortedArray[index].storeName + '</td>' +
                        '<td><a target="_blank" href="https://www.google.com/maps/place/' + sortedArray[index].local + '">' + sortedArray[index].local + '</a></td>' +
                        '<td id="' + sortedArray[index].userId + '">' +
                        '<button type="button" class="btn btn-success" id="goodPrice' + index + '" data-place="' + originalIndex + '"' +
                        ' data-uid="' + sortedArray[index].userId + '" data-key="' + key + '"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span></button> ' +
                        '<button type="button" class="btn btn-danger" id="badPrice' + index + '" data-place="' + originalIndex + '"' +
                        ' data-uid="' + sortedArray[index].userId + '" data-key="' + key + '"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button></td>' +
                        '<td>' + currentRel + '</td></tr>';
                listItem += tr;
            }
        });
        return listItem;
    }

    /**
     * 
     * @param {type} a | price a compared to...
     * @param {type} b | ... price b
     * @returns {Number}
     */

    function comparePrice(a, b) {//price sort ascending
        if (a.price < b.price)
            return -1;
        if (a.price > b.price)
            return 1;
        return 0;
    }

    /**
     * function used to grant and restrict privleges to users based on level
     */

    function userAccessSettings() {

        var user = firebase.auth().currentUser; //Get a user Reference
        var userRef = firebase.database().ref('user');
        userRef.orderByChild('uid').equalTo(user.uid).once('child_added', function (snapshot) {
            var user = snapshot.val();

            if (user.level > 6) {



            }

            if (user.level > 7) {//If the user is higher than level 7 they can edit descriptions                   
                $('#displayEdit').html("<button type='button' class='btn btn-success' id='deditable'>Edit</button>");
            }

        });

    }

    function modalMessaging(name, message, reason) {

        $('#feedbackTitle').html("<h4>Hey Hey... " + name + "</h4>");
        $('#feedbackMessage').html("<p class='col-sm-6'><img src='img/kudos.png' style='max-height: 200px;'></p>" +
                "<p class='col-sm-6'><h5>" + message + "</h5><h4><small>" + reason + "</small></h4></p>");
        $("#exampleModal").modal("show");
        $("html, body").animate({scrollTop: 0}, "slow");


    }
});

