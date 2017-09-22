/**
 * Created by Veket on 2016/10/24.
 */
var _=require('lodash');
var Promise=require('bluebird');
var lg=AppCtx.Logger('base-model');
var util=require('util');

var OP=['=','<','>','!=','>=','<=','between','not between','in','not in',
    'like','not like','is null','is not null'];
var OPMethod={
    'between':'whereBetween',
    'not between':'whereNotBetween',
    'in':'whereIn',
    'not in':'whereNotIn',
    'is null':'whereNull',
    'is not null':'whereNotNull'
};

module.exports=function(table,PK,logger){
    var s={table:table,PK:PK,logger:logger||lg};
    var knex = AppCtx.KNEX;

    /**
     *检查items是否包含没有PK字段的item，如果是则返回错误对象，否则返回false
     * @param items
     * @param PK
     * @returns {*}
     */
    var existNoPKItem=function(items,PK){
        var noPKItem=_.find(items,function(item){return !_.has(item,PK);});
        if(noPKItem){
            var err=util.format('数据项:%j,未定义主键字段:%s',noPKItem, PK);
            return new Error(err);
        }
        return false;
    };

    /**
     * 校验where格式
     * @param where
     * @param strict
     * @returns {boolean}
     */
    var isValidWhere=function(where,strict){
        if(!_.isObject(where)|| _.isArray(where)||
            _.isFunction(where))return false;

        if(!_.has(where,'__exps'))return true;

        var exps=where['__exps'];
        if(!_.isArray(exps))return false;
        if(_.isEmpty(exps))return true;

        var isFail=_.some(exps,function(exp){
            return !_.isArray(exp)||!exp[0]||! _.includes(OP,exp[1]);
        });

        return strict&&isFail?false:true;
    };

    /**
     *添加where条件，支持两种格式的where：1.普通JSON对象;2.{__exps:[[field,operator,values]]}
     * @param kx
     * @param where
     * @param strict
     * @returns {*}
     */
    var appendWhere=function(kx,where,strict){
        var err=new Error(util.format('where参数值定义错误: \n%j',where));
        if(!isValidWhere(where,strict))return err;

        if(!_.has(where,'__exps'))return kx.where(where);

        /*logic仅支持and，暂不支持or。如果是and则无需做特殊处理*/
        var logic='and';/*where['__logic']||*/
        var exps=where['__exps']||[];

        _.each(exps,function(exp){
            if(!_.isArray(exp))return;

            var f=exp[0],op=exp[1],v=exp[2];
            op= _.includes(OP,op)?op:'';
            if(!f||!op)return;

            var m=OPMethod[op]||'where';
            if(logic=='or')m=logic+_.capitalize(m);

            if(_.includes(m,'Null'))return kx[m](f);
            if(_.includes(m,'Between')|| _.includes(m,'In'))return kx[m](f,v);
            kx[m](f,op,v);
        });
    };

    /**
     *查询多记录
     * @param where 查询条件
     * @param fields lg：[field1,field2]||'field1,field2'
     * @param orderBy lg:'column asc,column desc'
     * @param limit 返回记录条数，默认10，全部-1
     * @param offset 默认0，从第几条开始
     * @param trx 事物控制
     */
    s.findAll=function(where,fields,orderBy,limit,offset,trx){
        trx=trx||knex;
        return new Promise(function(resolve,reject){
            fields=fields||[];
            fields= _.isString(fields)?fields.split(','):fields;

            var k=trx(s.table).select(fields);
            appendWhere(k,where);

            if(orderBy){
                _.each(orderBy.split(','),function(value){
                    var arr=value.split(' ');
                    k.orderBy(arr[0],arr[1]);
                });
            }
            if(limit!=-1) k.limit(parseInt(limit) || 10).offset(parseInt(offset) || 0);

            s.logger.debug('SQL:%s', k.toString());
            k.then(resolve,reject);
        });
    };

    /**
     *根据id，where查询单条记录
     * @param id
     * @param fields
     * @param where
     * @param trx
     * @returns {Promise|exports|module.exports}
     */
    s.findOne=function(id,fields,where,trx){
        trx=trx||knex;
        return new Promise(function(resolve,reject){
            if(!id) return resolve({});

            fields=fields||[];
            fields= _.isString(fields)?fields.split(','):fields;
            where=where||{};
            where[s.PK]=id;

            var k=trx(s.table).select(fields).where(where);
            s.logger.debug('SQL:%s', k.toString());
            k.then(function(rows){return rows[0] || {};}).then(resolve,reject);
        });
    };


    /**
     *根据where统计记录数
     * @param where
     * @param trx
     * @returns {Promise|exports|module.exports}
     */
    s.count=function(where,trx){
        trx=trx||knex;
        return new Promise(function(resolve,reject){
            var k=trx(s.table).count(s.PK+' as count');
            appendWhere(k,where);

            s.logger.debug('SQL:%s', k.toString());
            k.then(function(rows){return rows[0].count}).then(resolve,reject);
        });
    };

    /**
     *每个item使用1条插入sql语句，返回包含所有新增的记录的id数组
     * @param items
     * @param trx
     * @returns {Promise|exports|module.exports}
     */
    s.insert=function(items,trx){
        var exec=function(tx){
            return Promise.map(items,function(item){
                var k=tx(s.table).insert(item);
                s.logger.debug('SQL:%s',k.toString());
                return k;
            });
        };

        return new Promise(function(resolve,reject){
            if(!_.isArray(items)|| _.isEmpty(items)) return resolve([]);
            var kt=trx?exec(trx):knex.transaction(exec);
            kt.then(function(ids){return _.flatten(ids);}).then(resolve,reject);
        });
    };

    /**
     *批量插入数据，使用批量插入sql，返回新增的记录数
     * @param items
     * @param trx
     * @returns {Promise|exports|module.exports}
     */
    s.insertBatch=function(items,trx){
        trx=trx||knex;
        return new Promise(function(resolve,reject){
            if(!_.isArray(items)|| _.isEmpty(items)) return resolve(0);

            var k=trx(s.table).insert(items);
            s.logger.debug('SQL:%s',k.toString());
            k.then(function(){return items.length;}).then(resolve,reject);
        });
    };

    /**
     *如果data为包含多个item的数组，则使用update set {item} where {pk=item.pk} and {where}，
     *如果data为单个对象，则使用update {data} where {where}
     * @param data
     * @param where
     * @param trx
     * @returns {Promise|exports|module.exports} 返回被更新的记录数
     */
    s.update=function(data,where,trx){
        where=where||{};

        var exec=function(tx){
            return Promise.map(data,function(item){
                where[s.PK]=item[s.PK];
                var k=tx(s.table).update(item).where(where);
                s.logger.debug('SQL:%s',k.toString());
                return k;
            });
        };

        return new Promise(function(resolve,reject){
            if(_.isEmpty(data))return resolve(0);

            if(_.isArray(data)){
                var err=existNoPKItem(data, s.PK);
                if(err) return reject(err);

                var query=trx?exec(trx):knex.transaction(exec);
                return query.then(function(affectNums){
                    return _.reduce(affectNums,function(memo,num){return memo+num;},0);
                }).then(resolve,reject);
            }

            trx=trx||knex;
            var k=trx(s.table).update(data);
            var rs=appendWhere(k,where,true);
            if(util.isError(rs))return reject(rs);

            s.logger.debug('SQL:%s',k.toString());
            k.then(resolve,reject);
        });
    };

    /**
     *如果data为包含多个item的数组，则使用delete from where {pk in [items.pk]} and {where}
     *如果data为单个对象，则使用delete from where {where}
     * @param data
     * @param where
     * @param trx
     * @returns {Promise|exports|module.exports} 返回被删除的记录数
     */
    s.delete=function(data,where,trx){
        where=where||{};
        trx=trx||knex;

        return new Promise(function(resolve,reject){
            if(_.isArray(data)){
                if(_.isEmpty(data))return resolve(0);

                var err=existNoPKItem(data, s.PK);
                if(err) return reject(err);

                var ids=_.pluck(data, s.PK);
                var query=trx(s.table).delete().where(where).whereIn(s.PK,ids);
                s.logger.debug('SQL:%s',query.toString());
                return query.then(resolve,reject);
            }

            var k=trx(s.table).delete();
            var rs=appendWhere(k,where,true);
            if(util.isError(rs))return reject(rs);

            s.logger.debug('SQL:%s',k.toString());
            k.then(resolve,reject);
        });
    };

    return s;
};

