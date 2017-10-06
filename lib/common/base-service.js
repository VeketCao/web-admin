/**
 * Created by Veket on 2016/10/24.
 */
var _=require('lodash');
var express=require('express');
var qs=require('qs');
var Promise=require('bluebird');
var _lg=AppCtx.Logger('base-service.js');

var MAPPING=[
    ['count','/count','get'],
    ['findAll','/','get'],
    ['findOne','/:id','get'],
    ['insert','/','post'],
    ['update','/','put'],
    ['delete','/','delete']
];

var FILTER=[
    ['validate','/','use'],
    ['preprocess','/','use']
];

module.exports=function(model,logger){
    var s={
        model:model,
        logger:logger||_lg,
        filter:_.map(FILTER, _.clone),
        mapping: _.map(MAPPING, _.clone),//deep clone
        router:express.Router()
    };

    s.initRoute=function(){
        var s=this;

        _.each([].concat(s.filter).concat(s.mapping),function(v){
            if(_.has(s,v[0]))s.router[v[2]](v[1],s[v[0]]);
        });
        return s.router;
    };

    s.render=function(req,res,next,promise){
        promise.then(function(data){
            res.json({'data':_.isUndefined(data)?'':data});
        }).catch(function (error) {
            _lg.error(error);
            res.json({'error':error});
        });
    };

    s.validate=function(req,res,next){
        next();
    };
    s.preprocess=function(req,res,next){
        var where=req.query.where;
        if(where) req.query.where=qs.parse(where);
        next();
    };

    s.count=function(req,res,next){
        s.render(req,res,next,s.model.count(req.query.where));
    };

    s.findAll=function(req,res,next){
        var where=req.query.where;
        var fields=req.query.fields;
        var orderBy=req.query.orderBy;
        var limit=req.query.limit;
        var offset=req.query.offset;

        if(limit==-1){
            s.render(req,res,next,s.model.findAll(where,fields,orderBy,limit,offset));
        }else{
            Promise.map([s.model.count(where),
                    s.model.findAll(where,fields,orderBy,limit,offset)],
                function(item){return item;}
            ).then(function(data){
                res.json(_.zipObject(['total','data'],data));
            }).catch(next);
        }
    };

    s.findOne=function(req,res,next){
        s.render(req,res,next,s.model.findOne(req.params.id,req.query.fields));
    };

    s.insert=function(req,res,next){
        var items=req.body.data;
        var p= _.has(req.query,'batch')?s.model.insertBatch(items):s.model.insert(items);
        s.render(req,res,next,p);
    };

    s.update=function(req,res,next){
        s.render(req,res,next,s.model.update(req.body.data,req.query.where));
    };

    s.delete=function(req,res,next){
        s.render(req,res,next,s.model.delete(req.body.data,req.query.where));
    };

    return s;
};
