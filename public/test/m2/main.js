/**
 * Created by Veket on 2015/11/7.
 */
var m4Url= './m4/main.js';
define([m4Url,'app','text!./main.html','css!./main.css','domReady!'],function(M4,app,page){
    var $page,$mainCtx,m4;

    var loadM4=function(){
        $mainCtx.empty();
        m4.show($mainCtx);
    };

    var m4CloseHandle=function(e){
        layer.alert(e.rtn);
    };

    var bindEvent=function(){
        $("#load_m4",$page).bind("click",loadM4);
        m4.on("m4CloseEvent",m4CloseHandle);
    };

    var initPage=function(){
        $mainCtx = $("#m2_ctx",$page);
        m4=M4();
        bindEvent()
    };

    return{
        show:function($c){
            $page=$(page);
            $page.appendTo($c);
            initPage();
        },
        hide:function(){
            $page.remove();
        }
    }
});