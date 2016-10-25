/**
 * Created by Veket on 2015/11/7.
 */
define(['app','text!./main.html','css!./main.css','domReady!'],function(app,page){
    var $page,loader;

    var menus=[
        {id:'m3',title:'m3',url:'test/m1/m3/main.js'}
    ];

    var loadM3=function(){
       // app.hash("#!/m1/m3/22");
        loader.to("m3");
    };

    var bindEvent=function(){
        $("#load_m3",$page).bind("click",loadM3);
    };

    var initLoader=function(){
        loader=app.ModuleLoader({hash:'/m1/:id(/*suffix)',menus:menus,toFirst:false});
        loader.on('show',function(e){ e.container=$("#m1_ctx",$page)});
        loader.start();
    };

    var initPage=function(){
        bindEvent();
        /*app.http('/v1/test/',{limit:-1},{'type':'GET'}).done(function (rtn) {
            console.log(rtn);
        });*/
    };

    return{
        init:function(m){
            initLoader();
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