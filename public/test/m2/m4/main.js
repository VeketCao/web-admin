/**
 * Created by Veket on 2015/11/7.
 */
define(['app','text!./main.html','css!./main.css','domReady!'],function(app,page){
    return function(){
        var o=$({}), $page;

        //抛出m4关闭事件
        var closeHandle=function(){
            var event=$.Event("m4CloseEvent",{rtn:"m4 data"});
            o.trigger(event);
            if(event.isDefaultPrevented()) return;
            o.hide();
        };

        var initPage=function(){
            $("#close_m4",$page).bind("click",closeHandle);
        };

        o.show=function($c){
            $page=$(page);
            $page.appendTo($c);
            initPage();
        };
        o.hide=function(){
            $page.remove();
        };
        return o;
    };
});