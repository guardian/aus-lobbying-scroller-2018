export default function parseURL(){
    var urlParams; 
    var params = {};


    urlParams = window.location.hash.substring(2).split('&');
    urlParams.forEach(function(param){
     
        if (param.indexOf('=') === -1) {
            params[param.trim()] = true;
        } else {
            var pair = param.split('=');
            params[ pair[0] ] = pair[1];
        }
        
    });
    
    return params;
}