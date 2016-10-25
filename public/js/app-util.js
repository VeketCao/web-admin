/**
 * Created by Veket on 2016/10/25.
 */
/**防止ie8非调试状态下console报错**/
var __initConsole=function(){
    window.console = window.console || (function(){
            var c = {}; c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile
                = c.clear = c.exception = c.trace = c.assert = function(){};
            return c;
        })();
};

var __initLayer=function(){
    layer.config({ path: 'lib/layer/'});
};

var __initCookie=function(app){
    app.getCookie = function(name){
        return $.cookie(name);
    };
    app.setCookie = function(name, value,opt){
        var Days = 30;
        var exp = new Date();
        exp.setTime(exp.getTime() + Days*24*60*60*1000);
        opt= _.extend(opt||{},{expires: exp});
        $.cookie(name, value, opt);
    };
    app.removeCookie=function(name){
        $.removeCookie(name);
    }
};

var __initHttp=function(app){
    app.http = function (url, param, options) {
        param = param || {};
        var dtd = $.Deferred();
        var opts =_.defaults(options||{},{ dataType:"json",type:"POST",cache:false,timeout:120000});
        opts= _.extend(opts,{data:param,url:url});
        $.ajax(opts).done(function (rtn) {
            dtd.resolve(rtn);
        }).fail(function (rtn) {
            console.log("url",url);
            console.error("error",rtn);
            dtd.reject(rtn);
        }).always(function () {});
        return dtd.promise();
    };
};

var __initEvents=function(app){
    app.EventEmitter=function(target){
        var t=target||{};
        var o=$({});
        t.on=function(){o.on.apply(o, arguments);};
        t.one=function(){o.one.apply(o, arguments);};
        t.off=function(){o.off.apply(o, arguments);};
        t.trigger=function(){o.trigger.apply(o, arguments);};
        return t;
    };
    app.EventEmitter(app);
};

var __initRoute=function(app){
    app.hash=function(v){
        if(!v)return window.location.hash;
        window.location.hash=v;
    };

    /**
     * @param ops:
     * hash：必填，要监听的hash模式：'/:id(/*suffix)';
     * menus：必填，包含模块url的菜单项数组，item必须包含id和url属性;
     * @constructor
     */
    app.ModuleLoader=function(ops){
        ops= _.defaults(ops,{ toFirst:true});
        var s={modules:{current:''},menus:ops.menus||[]};
        var prefix= _.str.strLeft(ops.hash,':id');
        var invoke=function(m,mt,ps){
            var ex=m? m.exports:'';
            if(ex&& _.isFunction(ex[mt])){
                if(_.isUndefined(ps)|| _.isNull(ps)){
                    return ex[mt].apply();
                }else{
                    return ex[mt].apply(ex,ps);
                }
            }
        };
        var trigger=function(type,ps){
            var e= $.Event(type,ps);
            s.trigger(e);
            return {stop:e.isDefaultPrevented(),event:e}
        };
        var getUrl=function(id){
            if(!id||!s.menus)return;
            var m= _.find(s.menus,function(mu){return mu.id==id;});
            return m? m.url:'';
        };
        var checkDirty=function(e){
            layer.confirm('离开当前页面将丢失修改的内容，确定离开？',{ title:"离开提醒",btn: ['确定离开','留在当前页面'] },
                function(){
                    app.status.dirty=false;
                    app.hash('!'+ e.url);
                    layer.closeAll();
                },function(){
                    layer.closeAll();
                });
        };
        var routerChange=function(e){
            /**脏数据**/
            if(app.status.dirty) {
                e.preventDefault();
                checkDirty(e);
            }
        };
        var listen=function(){
            s.router.route(ops.hash,function(id,suffix){
                app.suffix=suffix;
                var args=_.toArray(arguments);
                if(trigger('route',{args:args}).stop)return;
                if(s.modules[id])return s.show(id);
                s.load(id);
            });

            s.router.bind('change',routerChange);
        };
        app.EventEmitter(s);

        s.router=new kendo.Router({hashBang: true});
        s.start=function(){
            s.router.start();
            if(!ops.toFirst|| _.isEmpty(s.menus))return;
            var hash= _.str.strRight(app.hash(),'!');
            hash= _.str.strLeft(hash,'?');
            if(!_.str.endsWith(hash,'/'))hash+='/';
            if(hash==prefix)s.to(s.menus[0].id);
        };
        s.stop=function(){s.router.destroy();};
        /*使用s.router.navigate()会先触发route事件，然后改变hash值，所以舍弃不用*/
        s.to=function(id){ app.hash('!'+prefix+id); };

        s.load=function(id){
            var url= getUrl(id);
            if(!id||!url||s.modules[id])return;
            if(trigger('load',{mid:id}).stop)return;
            require([url],function(exports){
                /*模块之间可通过loader互相通信*/
                var m={id:id,url:url,exports:exports,loader:s};
                s.modules[id]=m;
                if(trigger('loaded',{m:m}).stop)return;
                invoke(m,'init',[m]);
                s.show(id);
            });
        };

        s.show=function(id){
            var m=s.modules[id];
            var cm=s.modules.current;
            //if(!m||m==cm)return;
            var ps={from:cm,to:m,show:true,hide:true};
            var rs=trigger('show',ps);
            if(rs.stop)return;

            var e=rs.event;
            e.keep= _.has(e,'keep')? e.keep: !e.hide;
            $(document).scrollTop(0);
            if(e.hide){ invoke(cm,'hide');}
            if(e.show)invoke(m,'show',[e.container]);
            if(!e.keep)s.modules.current=m;
            trigger('showed',{m:m});
        };
        listen();
        return s;
    };
};

var __initUtil=function(app){
    app.isIE=function(){
        return !_.isEmpty((navigator.userAgent.toLowerCase()).match(/(msie\s|trident.*rv:)([\w.]+)/));
    };

    app.nano=function(template, data) {
        template =$.trim(template);
        return template.replace(/\{([\w\.]*)\}/g, function(str, key) {
            var keys = key.split("."), v = data[keys.shift()];
            for (var i = 0, l = keys.length; i < l; i++) v = v[keys[i]];
            return (typeof v !== "undefined" && v !== null) ? v : "";
        });
    };
};

define(['jquery','underscore','underscore.string','router','jquery.cookie','layer','base64'],function () {
    var app = {};

    $.support.cors = true;
    app.status={dirty:''};
    __initConsole();
    __initLayer();
    __initCookie(app);
    __initEvents(app);
    __initHttp(app);
    __initUtil(app);
    __initRoute(app);

    return app;
});