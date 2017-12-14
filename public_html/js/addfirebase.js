/* global firebase */

$.when(//Load firebase init
        $.getScript("js/firebaseinit.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {
    $(document).ready(function () {

        /****************************************************************************ADD A PRODUCT*/

        $('#pAdd').on('click', function () {//add.html
            var user = firebase.auth().currentUser;//get current user
            var form = document.querySelector('form');//Get the form
            form.addEventListener('submit', function (event) {//on submit
                event.preventDefault();//prevent submit
                var file_data = $('#pImage').prop('files')[0];//find the image file
                if (file_data === '' || file_data === null || typeof file_data === 'undefined') {
                    modalMessaging("OH NO...", user.name, "You must include an image", "", false);
                } else {
                    var storageRef = firebase.storage().ref('/productimages/' + file_data.name);//get storage reference
                    storageRef.put(file_data);//add the image to the storage reference                
                    /*Now build the product object*/
                    var price = $('#pPrice').val();
                    var storeName = $('#pStore').val();
                    var local = $('#pLocation').val();
                    var userId = user.uid;
                    if (price === '') {
                        modalMessaging("OH NO...", "", "You must include a price", "", false);
                    } else if (storeName === '') {
                        modalMessaging("OH NO...", "", "You must include a store name", "", false);
                    } else if (local === '') {
                        modalMessaging("OH NO...", "", "You must include a location", "", false);
                    } else if ($('#pName').val() === '') {
                        modalMessaging("OH NO...", "", "You must include a location", "", false);
                    } else if ($('#pPricePer').val() === '') {
                        modalMessaging("OH NO...", "", "You must include a location", "", false);
                    } else if ($('#pCategory').val() === '') {
                        modalMessaging("OH NO...", "", "You must include a category", "", false);
                    } else if ($('#pDescription').val() === '') {
                        modalMessaging("OH NO...", "", "You must include a description", "", false);
                    }else {


                        var newProduct = {
                            productAuthorName: user.displayName,
                            productAuthorEmail: user.email,
                            productName: $('#pName').val(),
                            productPrice: [{price, storeName, local, userId}],
                            productPer: $('#pPricePer').val(),
                            productCategory: $('#pCategory').val(),
                            productDescription: $('#pDescription').val(),
                            productImage: file_data.name
                        };
                        setTimeout(function () {
                            dbRef.child('products').push(newProduct);//push the product object to db
                        }, 1000);

                        /*give the user points for the new product added*/
                        var ref = firebase.database().ref("user");
                        ref.orderByChild("uid").equalTo(user.uid).on("child_added", function (snapshot) {
                            var user = snapshot.val();
                            var addPoints = parseInt(user.pAdd) + 1;
                            snapshot.ref.update({pAdd: addPoints});/*****************************************USER AWARD*/
                            modalMessaging("Hey Hey... ", user.name, "You got 10 Points!", "FOR: Adding a New Product!", true);
                            $('#aForm').attr('style', 'display: none;');
                            $('#goHome').attr('style', 'display: contents;');
                            $('#goHome').on('click', function () {
                                location.href = '?&page=shop';
                            });
                        });
                    }
                }
            });
//            setTimeout(function () {//After add completed, send them back home
//                location.href = '/';
//            }, 4000);
        });//END OF PRODUCT ADD LISTENER  
        var dbRef = firebase.database().ref('/');
        dbRef.child('products').on('child_added', productListeners);

        function productListeners(e) {//call multiple product functions from one firebase listener            
            getProductNames(e);
            getProductCats(e);
        }

        /**
         * The product name input contains a "dataList". This function appends all
         * current product names to that datalist to assist in preventing duplicates.
         * @param {type} snapshot firebase Object
         * 
         */

        function getProductNames(snapshot) {//appends all current product names for datalist "search"
            var products = snapshot.val();
            $('#search').append($('<option>', {
                value: products.productName
            }));


        }

        /**
         *  The "Department" input contains a "dataList". This function appends all
         * current Departments to that datalist to assist in preventing duplicates.
         * @param {type} snapshot firebase object
         * 
         */

        function getProductCats(snapshot) {//appends all current department names for datalist "category"
            //snapshot is the record
            //get data from the snapshot
            var products = snapshot.val();
            $('#category').append($('<option>', {
                value: products.productCategory
            }));


        }
        /**
         * 
         * @param name The user's displayName
         * @param message The reason why the modal is popping up
         * @param reason The reason why the user was awarded points
         * @param displayImage boolean used to determine wheter to display kudos or not.
         * @returns Presents Popup Modal
         */
        function modalMessaging(salutation, name, message, reason, displayImage) {

            $('#feedbackTitle').html("<h4>" + salutation + name + "</h4>");
            
            var feedbackMessage = '';
            if(displayImage){
                feedbackMessage = "<p class='col-sm-6'><img src='img/kudos.png' style='max-height: 200px;'></p>";
            }
            
            $('#feedbackMessage').html( feedbackMessage +                    
                    "<p class='col-sm-6'><h5>" + message + "</h5><h4><small>" + reason + "</small></h4></p>");
            $("#exampleModal").modal("show");
            $("html, body").animate({scrollTop: 0}, "slow");


        }
    });

});