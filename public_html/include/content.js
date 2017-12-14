$(document).ready(function(){
    
    var page = getParameter("page");
    var alt = "";
    if(page === 1){
        page = 'shop';
    }
    
    $(window).ready(function(){        
        $.get("include/pages/" + page + ".html", function(fileData){
          $('#contentPortion').html(fileData);
        });
            }); 

    $.when(
            
        $.getScript("js/" + page + "firebase.js"),
        $.Deferred(function (deferred) {
            $(deferred.resolve);
        })
        ).done(function () {});
});


    function getParameter(name, url) {//We can then return the URL like this
        if (!url)
            url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
        if (!results)
            return 1;//if no parameters return the first option
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

