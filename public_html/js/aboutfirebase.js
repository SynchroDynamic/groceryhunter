$.when(//Load firebase init
        $.getScript("js/firebaseinit.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {});