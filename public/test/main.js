/**
 * Created by Veket on 2015/11/7.
 */
require(['app'],function(app){
    var menus=[
        {id:'m1',title:'m1',url:'test/m1/main.js'},
        {id:'m2',title:'m2',url:'test/m2/main.js'}
    ];

    var initLoader=function(){
        var loader=app.ModuleLoader({ hash:'/:id(/*suffix)',menus:menus,toFirst:false});
        loader.on('show',function(e){ e.container=$('#main');});
        loader.start();
    };

    var initPage=function(){
        initLoader();
    };

    initPage();
});