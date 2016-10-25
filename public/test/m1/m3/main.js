/**
 * Created by Veket on 2015/11/7.
 */
define(['app','text!./main.html','css!./main.css','domReady!'],function(app,page){
    var $page;

    var initPage=function(){
        console.log(app.suffix);
    };

    return{
        init:function(m){
        },
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